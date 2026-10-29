#!/usr/bin/env python3
"""
Обработка озвучки (PEREGON_voice.md, §5) и выгрузка в Remotion (§7).

  python3 voice/process.py                 # все реплики из voice/raw → public/voice/epN/<ID>.wav + src/episodes/epN/voice.json
  python3 voice/process.py E1-05 E1-06     # перезаписать только эти WAV (voice.json пересобирается целиком)
  python3 voice/process.py --selftest DIR  # прогнать все цепочки на синтетическом сигнале (без API)

Вход: voice/raw/epN/<ID>.wav (сухая генерация, 44,1 кГц) и <ID>.json (alignment из /with-timestamps).
Цепочка каждой реплики: срез < 70 Гц → де-эссер 4–8 кГц → компрессия 2:1 → громкость персонажа по манере →
пространство (свёртка с синтетической импульсной характеристикой) или рация/громкоговоритель.
"""
import json
import math
import os
import sys

import numpy as np
import soundfile as sf
from scipy import signal

sys.path.insert(0, os.path.dirname(__file__))
from lines import BY_ID, CHARACTERS, LEVEL_DB, LINES, RECAPS, RECAP_LEAD, Line  # noqa: E402

SR = 44100
FPS = 30
ROOT = os.path.join(os.path.dirname(__file__), '..')
RAW = os.path.join(ROOT, 'voice', 'raw')
TRIMMED = os.path.join(ROOT, 'voice', 'trimmed')  # паузы сокращены (voice/trim.py) — берётся в первую очередь
PUB = os.path.join(ROOT, 'public', 'voice')
PEAK_DB = -1.0


def db(x):
    return 10 ** (x / 20)


# ─────────────────────────── фильтры и динамика

def sos_filter(x, sos):
    return signal.sosfilt(sos, x, axis=0)


def hp(x, f, order=4):
    return sos_filter(x, signal.butter(order, f, 'highpass', fs=SR, output='sos'))


def lp(x, f, order=4):
    return sos_filter(x, signal.butter(order, f, 'lowpass', fs=SR, output='sos'))


def bp(x, lo, hi, order=4):
    return sos_filter(x, signal.butter(order, [lo, hi], 'bandpass', fs=SR, output='sos'))


def peaking(x, f0, gain_db, q=1.0):
    """Колокол RBJ."""
    a = 10 ** (gain_db / 40)
    w = 2 * math.pi * f0 / SR
    al = math.sin(w) / (2 * q)
    b = [1 + al * a, -2 * math.cos(w), 1 - al * a]
    aa = [1 + al / a, -2 * math.cos(w), 1 - al / a]
    return signal.lfilter(np.array(b) / aa[0], np.array(aa) / aa[0], x, axis=0)


def envelope(x, attack_ms, release_ms):
    """Огибающая RMS с разными атакой и восстановлением."""
    p = x.astype(np.float64) ** 2
    a = math.exp(-1 / (SR * attack_ms / 1000))
    r = math.exp(-1 / (SR * release_ms / 1000))
    out = np.empty_like(p)
    e = 0.0
    for i, v in enumerate(p):  # короткие реплики — цикл достаточно быстрый
        k = a if v > e else r
        e = k * e + (1 - k) * v
        out[i] = e
    return np.sqrt(out + 1e-12)


def compress(x, ratio, thresh_db, attack_ms=10, release_ms=120, knee_db=6):
    env_db = 20 * np.log10(envelope(x, attack_ms, release_ms) + 1e-9)
    over = env_db - thresh_db
    # мягкое колено
    gr = np.where(over <= -knee_db / 2, 0,
                  np.where(over >= knee_db / 2, over * (1 - 1 / ratio),
                           (1 - 1 / ratio) * (over + knee_db / 2) ** 2 / (2 * knee_db)))
    return x * db(-gr)


def deess(x, thresh_db=-30, max_red_db=8):
    band = bp(x, 4000, 8000, 2)
    env_db = 20 * np.log10(envelope(band, 2, 60) + 1e-9)
    red = np.clip(env_db - thresh_db, 0, max_red_db)
    return x - band + band * db(-red)


def loudness(x):
    import pyloudnorm as pyln
    if len(x) < int(0.45 * SR):  # pyloudnorm требует хотя бы один блок 400 мс
        x = np.concatenate([x, np.zeros(int(0.45 * SR) - len(x) + 10)])
    v = pyln.Meter(SR).integrated_loudness(x if x.ndim == 1 else x)
    if not np.isfinite(v):
        v = 20 * np.log10(np.sqrt(np.mean(x ** 2)) + 1e-9) - 0.7
    return v


def true_peak_db(x):
    up = signal.resample_poly(x, 4, 1, axis=0)
    return 20 * np.log10(np.max(np.abs(up)) + 1e-12)


def limit(x, ceiling_db, lookahead_ms=5, release_ms=80):
    """Мягкий пиковый лимитер с упреждением: срезает редкие пики, не трогая остальное."""
    mono = np.abs(x) if x.ndim == 1 else np.max(np.abs(x), axis=1)
    need = np.minimum(1, db(ceiling_db) / (mono + 1e-12))
    la = int(lookahead_ms / 1000 * SR)
    # минимум по окну упреждения, затем плавное восстановление
    from scipy.ndimage import minimum_filter1d
    g = minimum_filter1d(need, size=2 * la + 1)
    r = math.exp(-1 / (SR * release_ms / 1000))
    out = np.empty_like(g)
    e = 1.0
    for i, v in enumerate(g):
        e = v if v < e else r * e + (1 - r) * v
        out[i] = e
    return x * (out if x.ndim == 1 else out[:, None])


def normalize(x, target_lufs, max_limit_db=4):
    y = x * db(target_lufs - loudness(x))
    tp = true_peak_db(y)
    if tp > PEAK_DB:
        # до 4 дБ — лимитер на пиках, остальное — опустить всю реплику, чтобы не исказить
        y = limit(y, PEAK_DB - 0.3)
        y *= db(min(0, target_lufs - loudness(y)))
        tp = true_peak_db(y)
        if tp > PEAK_DB:
            y *= db(PEAK_DB - tp)
    return y


def trim_silence(x, thresh_db=-50, margin_ms=40, max_keep_ms=300):
    """Тишина в начале и конце — не больше 300 мс; режем по −50 дБ с запасом 40 мс. Возвращает (сигнал, сдвиг начала в с)."""
    mono = x if x.ndim == 1 else x.mean(axis=1)
    env = 20 * np.log10(envelope(mono, 1, 30) + 1e-9)
    idx = np.where(env > thresh_db)[0]
    if not len(idx):
        return x, 0.0
    m = int(margin_ms / 1000 * SR)
    a = max(0, idx[0] - m)
    b = min(len(x), idx[-1] + m)
    return x[a:b], a / SR


def base_chain(x):
    x = hp(x, 70)
    x = deess(x)
    x = compress(x, 2, -24, 8, 150)
    return x


# ─────────────────────────── импульсные характеристики

def make_ir(rt60, *, hf_rt=None, predelay_ms=0, early=(), length=None, seed=1, bright=8000, density=1.0):
    """
    Синтетическая импульсная характеристика: экспоненциально затухающий шум,
    верхи затухают быстрее (hf_rt), плюс ранние отражения [(мс, усиление)].
    """
    rng = np.random.default_rng(seed)
    n = int((length or rt60 * 1.2) * SR)
    t = np.arange(n) / SR
    noise = rng.standard_normal(n)
    if density < 1:  # разреженный шум — «металлическая» зернистость
        noise *= rng.random(n) < density
    low = lp(noise, 1500, 2)
    high = noise - low
    hf_rt = hf_rt or rt60 * 0.6
    tail = low * np.exp(-6.91 * t / rt60) + high * np.exp(-6.91 * t / hf_rt)
    tail = lp(tail, bright, 2)
    # плавное начало хвоста
    tail *= np.minimum(1, t / 0.012)
    ir = np.zeros(n + int(predelay_ms / 1000 * SR) + 1)
    ir[int(predelay_ms / 1000 * SR):][:n] += tail * 0.25
    for ms, g in early:
        k = int((predelay_ms + ms) / 1000 * SR)
        if k < len(ir):
            ir[k] += g * (1 if rng.random() > 0.3 else -1)
    return ir / (np.sqrt(np.sum(ir ** 2)) + 1e-9)


def _flutter(period_ms, count, g0, decay):
    return [(period_ms * (i + 1), g0 * decay ** i) for i in range(count)]


SPACES = {
    # код: (импульс, доля обработанного, срез верхов обработанного)
    'CAR': lambda: (make_ir(0.3, hf_rt=0.15, early=[(4, 0.5), (7, 0.35), (11, 0.25)], seed=11), 0.10, 7000),
    'CAR_DARK': lambda: (make_ir(0.45, hf_rt=0.35, early=[(3, 0.7), (5, 0.55), (8, 0.45), (12, 0.3), (17, 0.22)], seed=12,
                                 density=0.35, bright=9000), 0.16, 9000),
    'TUNNEL': lambda: (make_ir(2.5, hf_rt=0.7, predelay_ms=18, early=_flutter(23, 14, 0.45, 0.82), seed=13, length=3.2,
                               bright=4500), 0.26, 4000),
    'SHAFT': lambda: (make_ir(3.3, hf_rt=1.6, predelay_ms=40, early=[(9, 0.4), (21, 0.35), (37, 0.3), (58, 0.22)], seed=14,
                              length=4.0, bright=7000), 0.30, 6500),
    'CAB': lambda: (make_ir(0.25, hf_rt=0.12, early=[(2, 0.6), (4, 0.45), (6, 0.3)], seed=15), 0.12, 3500),
}


def convolve(x, ir):
    return signal.fftconvolve(x, ir)[: len(x) + len(ir) - 1]


def space(x, code, whisper):
    ir, wet, hf = SPACES[code]()
    if whisper:  # шёпот тонет в реверберации — обработанного меньше
        wet *= 0.5
    w = lp(convolve(x, ir), hf, 2)
    w *= np.sqrt(np.mean(x ** 2)) / (np.sqrt(np.mean(w[: len(x)] ** 2)) + 1e-9)
    y = np.concatenate([x, np.zeros(len(w) - len(x))]) * math.sqrt(1 - wet) + w * math.sqrt(wet)
    if code == 'CAR_DARK':  # гул туннеля под голосом, едва заметный
        rng = np.random.default_rng(5)
        rumble = bp(rng.standard_normal(len(y)), 35, 60, 2)
        rumble *= db(-46) / (np.sqrt(np.mean(rumble ** 2)) + 1e-9) * np.sqrt(np.mean(x ** 2)) / db(-20)
        y += rumble
    return y


# ─────────────────────────── рация и громкоговорители

def pink(n, seed):
    rng = np.random.default_rng(seed)
    w = rng.standard_normal(n)
    f = np.fft.rfft(w)
    k = np.arange(len(f))
    k[0] = 1
    p = np.fft.irfft(f / np.sqrt(k), n)
    return p / (np.sqrt(np.mean(p ** 2)) + 1e-9)


def rms(x):
    return np.sqrt(np.mean(x ** 2)) + 1e-12


def intercom(x, seed=1):
    """Громкая связь в вагоне: маленький динамик на пределе, металлическое пространство, гул сети, щелчки."""
    rng = np.random.default_rng(seed)
    y = bp(x, 250, 4500, 4)
    y = peaking(y, 1800, 4, 1.2)
    y = compress(y, 6, -30, 1, 60, knee_db=3)
    y = np.tanh(y / rms(y) * 0.25) * rms(y) * 2.6
    ir = make_ir(0.35, hf_rt=0.2, early=[(8, 0.7), (11, 0.6), (14, 0.5), (17, 0.45), (20, 0.4)], seed=21, density=0.4)
    y = 0.8 * np.concatenate([y, np.zeros(len(ir) - 1)]) + 0.35 * convolve(y, ir) * rms(y) / (rms(convolve(y, ir)) + 1e-9)
    lvl = rms(y)
    # щелчок включения + 30 мс шипа; хвост 120–180 мс шума с щелчком отключения
    pre = np.zeros(int(0.045 * SR))
    pre[:40] = np.hanning(80)[:40] * lvl * 6
    pre[40:40 + int(0.03 * SR)] += rng.standard_normal(int(0.03 * SR)) * lvl * 0.25
    tail_n = int(rng.uniform(0.12, 0.18) * SR)
    tail = rng.standard_normal(tail_n) * lvl * 0.3 * np.linspace(1, 0.05, tail_n)
    tail[-30:] += np.hanning(60)[30:] * lvl * 4
    out = np.concatenate([pre, y, tail])
    n = len(out)
    t = np.arange(n) / SR
    hum = sum(np.sin(2 * math.pi * 50 * h * t) / h for h in (1, 2, 3, 5))
    out += hum / rms(hum) * lvl * db(-42 + 20) * 0.1 + bp(rng.standard_normal(n), 2000, 7000, 2) * lvl * db(-45 + 20) * 0.1
    return bp(out, 120, 6000, 2), len(pre) / SR


def protected_ranges(alignment, phrases, shift):
    """Интервалы (с), где звучат фразы, которые обязаны быть разборчивыми."""
    if not alignment:
        return []
    chars = alignment['characters']
    text = ''.join(chars).lower()
    out = []
    for p in phrases:
        i = text.find(p.lower())
        while i >= 0:
            a = alignment['character_start_times_seconds'][i] - shift
            b = alignment['character_end_times_seconds'][i + len(p) - 1] - shift
            out.append((a - 0.08, b + 0.08))
            i = text.find(p.lower(), i + 1)
    return out


def radio(x, seed, protect):
    """Радиоэфир: полоса, плавание частоты, треск, шум эфира, выпадения сигнала (не на защищённых словах)."""
    rng = np.random.default_rng(seed)
    y = bp(x, 300, 3400, 4)
    y = compress(y, 4, -28, 3, 80)
    # медленное плавание частоты: вибрато 0,3–0,6 Гц, глубина 0,3 %
    n = len(y)
    t = np.arange(n) / SR
    rate = rng.uniform(0.3, 0.6)
    warp = t + 0.003 / (2 * math.pi * rate) * np.sin(2 * math.pi * rate * t)
    y = np.interp(warp * SR, np.arange(n), y)
    lvl = rms(y)
    air = bp(pink(n, seed + 1), 300, 3400, 2) * lvl * db(-28 + 12)
    # выпадения
    gain = np.ones(n)
    drops, tries = 0, 0
    target = rng.integers(4, 7)
    while drops < target and tries < 400:
        tries += 1
        d = rng.uniform(0.06, 0.25)
        a = rng.uniform(0.4, n / SR - d - 0.2)
        if any(a < pb and a + d > pa for pa, pb in protect):
            continue
        i0, i1 = int(a * SR), int((a + d) * SR)
        ramp = int(0.008 * SR)
        g = np.full(i1 - i0, db(-30))
        g[:ramp] = np.linspace(1, db(-30), ramp)
        g[-ramp:] = np.linspace(db(-30), 1, ramp)
        gain[i0:i1] = np.minimum(gain[i0:i1], g)
        drops += 1
    noise_gain = 1 + (1 - gain) * 2.5  # в провал шум эфира громче
    out = y * gain + air * noise_gain
    # треск: редкие короткие импульсы
    for _ in range(int(n / SR * 1.5)):
        k = rng.integers(0, n - 200)
        out[k:k + rng.integers(20, 160)] += rng.standard_normal(1)[0] * lvl * rng.uniform(1, 3)
    return out


def street_pa(x, seed=3):
    """Уличные рупоры: узкая полоса, насыщение, эхо от домов, длинный хвост, два динамика в стерео, без сухого сигнала."""
    y = bp(x, 400, 3800, 4)
    y = compress(y, 8, -30, 1, 50, knee_db=3)
    y = np.tanh(y / rms(y) * 0.35) * rms(y) * 2
    tail_s = 3.6
    n = len(y) + int((0.9 + tail_s) * SR)
    out = np.zeros(n)
    out[: len(y)] += y * 0.5
    for i, (ms, g) in enumerate([(180, 0.4), (420, 0.25), (900, 0.15)]):
        k = int(ms / 1000 * SR)
        e = lp(y, 3000 - 700 * (i + 1), 2) * g
        out[k:k + len(e)] += e
    ir = make_ir(3.5, hf_rt=1.2, predelay_ms=60, seed=seed, length=tail_s, bright=2500)
    w = convolve(y, ir)[:n]
    out[: len(w)] += w * rms(y) / (rms(w) + 1e-9) * 0.45
    out = lp(out, 3000, 4)
    d = int(0.11 * SR)
    right = np.concatenate([np.zeros(d), out[:-d]]) * db(-6)
    return np.stack([out, right], axis=1)


def tss(x):
    return peaking(x, 4500, 4, 0.8)


def lowpass_choke(x, frames):
    """Голос глохнет: ФНЧ с 8 кГц до 150 Гц за N кадров в конце, затем срез."""
    n = int(frames / FPS * SR)
    if n <= 0 or n >= len(x):
        return x
    head, end = x[:-n], x[-n:].copy()
    blocks = 12
    step = math.ceil(n / blocks)
    zi = None
    out = []
    for i in range(blocks):
        f = 8000 * (150 / 8000) ** (i / (blocks - 1))
        sos = signal.butter(2, f, 'lowpass', fs=SR, output='sos')
        seg = end[i * step:(i + 1) * step]
        if zi is None:
            zi = signal.sosfilt_zi(sos) * seg[0]
        o, zi = signal.sosfilt(sos, seg, zi=zi)
        out.append(o * (1 - 0.5 * i / blocks))
    return np.concatenate([head, np.concatenate(out)])


# ─────────────────────────── реплика целиком

def target_lufs(line: Line):
    return CHARACTERS[line.who].base_lufs + LEVEL_DB[line.level] + line.gain_db


def process_line(line: Line, x, alignment):
    """Возвращает (обработанный сигнал, сдвиг: на сколько секунд позже начала сырого файла звучит его начало)."""
    whisper = line.level == 'whisper'
    x, shift = trim_silence(x)
    if line.cut_frames:
        x = x[: max(1, len(x) - int(line.cut_frames / FPS * SR))]
    x = base_chain(x)
    if line.choke_frames:
        x = lowpass_choke(x, line.choke_frames)
    x = normalize(x, target_lufs(line))
    offset = 0.0
    seed = sum(map(ord, line.id))
    if line.fx == 'DRY':
        y = x
    elif line.fx in SPACES:
        y = space(x, line.fx, whisper)
    elif line.fx == 'INTERCOM':
        y, offset = intercom(x, seed)
    elif line.fx == 'RADIO_INTERCOM':
        prot = protected_ranges(alignment, ['радиационной опасности', 'Гермозатворы', 'Оставайтесь на местах'], shift)
        y, offset = intercom(radio(x, seed, prot), seed)
    elif line.fx == 'STREET_PA':
        y = street_pa(x, seed)
    elif line.fx == 'TSS':
        y = tss(x)
    else:
        raise ValueError(line.fx)
    y = normalize(y, target_lufs(line))
    return y, shift - offset


def street_fragment(x, alignment):
    """E5-09: из той же генерации E1-06 — «…оставайтесь на местах… не покидайте укрытия…»."""
    if not alignment:
        return x, 0.0
    text = ''.join(alignment['characters']).lower()
    a = text.find('оставайтесь')
    b = text.find('укрытия')
    if a < 0 or b < 0:
        return x, 0.0
    t0 = alignment['character_start_times_seconds'][a] - 0.05
    t1 = alignment['character_end_times_seconds'][b + len('укрытия') - 1] + 0.15
    seg = x[int(t0 * SR):int(t1 * SR)]
    fade = int(0.03 * SR)
    seg[:fade] *= np.linspace(0, 1, fade)
    seg[-fade:] *= np.linspace(1, 0, fade)
    return seg, t0


# ─────────────────────────── привязка к картинке

def scene_times(ep):
    """Сцены серии из src/episodes/epN/timing.ts: {id: (начало, конец)} в секундах."""
    import re
    from lines import tc
    with open(os.path.join(ROOT, 'src', 'episodes', f'ep{ep}', 'timing.ts'), encoding='utf-8') as f:
        src = f.read()
    return {m[1]: (tc(m[2]), tc(m[3])) for m in re.finditer(r"\['(\w+)',\s*'([\d:.]+)',\s*'([\d:.]+)'\]", src)}


def spoken_words(alignment):
    """[(слово, начало, конец)] без тегов [..] — по таймингу символов."""
    out, cur, tag = [], None, False
    chars = alignment['characters']
    for i, c in enumerate(chars):
        if c == '[':
            tag = True
        if not tag and (c.isalpha() or c.isdigit()):
            a, b = alignment['character_start_times_seconds'][i], alignment['character_end_times_seconds'][i]
            cur = [cur[0] + c, cur[1], b] if cur else [c, a, b]
        elif cur:
            out.append(tuple(cur))
            cur = None
        if c == ']':
            tag = False
    if cur:
        out.append(tuple(cur))
    return out


def _norm(w):
    return w.lower().replace('ё', 'е')


def place_words(x, alignment, first_at, targets):
    """
    Вставить тишину в сухой сигнал, чтобы слова из targets ({слово: время в серии, с}) прозвучали в свой момент,
    если первое слово реплики звучит в first_at. Тишина ставится сразу после предыдущего слова
    (вдох перед словом остаётся при нём). Возвращает (сигнал, alignment, [(слово, опоздание с)]).
    """
    words = spoken_words(alignment)
    if not words:
        return x, alignment, []
    t0 = words[0][1]
    late = []
    gaps = []  # (момент в сыром сигнале, длительность)
    added = 0.0
    k = 0
    for target_word, target_t in targets.items():
        idx = next((i for i in range(max(k, 1), len(words)) if _norm(words[i][0]) == _norm(target_word)), None)
        if idx is None:
            late.append((target_word, None))
            continue
        k = idx + 1
        natural = first_at + (words[idx][1] - t0) + added
        gap = target_t - natural
        if gap < -0.05:
            late.append((target_word, -gap))
        if gap <= 0:
            continue
        prev_end, start = words[idx - 1][2], words[idx][1]
        gaps.append((prev_end + min(0.15, (start - prev_end) / 2), gap))
        added += gap
    if not gaps:
        return x, alignment, late
    pieces, last = [], 0
    x = x.copy()
    ramp = int(0.01 * SR)
    for at_s, g in gaps:
        i = int(at_s * SR)
        # короткие спады по краям вставки — без щелчка, даже если в точке разреза шум или вдох
        x[max(last, i - ramp):i] *= np.linspace(1, 0, i - max(last, i - ramp))
        x[i:i + ramp] *= np.linspace(0, 1, len(x[i:i + ramp]))
        pieces += [x[last:i], np.zeros(int(round(g * SR)))]
        last = i
    pieces.append(x[last:])
    al = {k2: list(v) for k2, v in alignment.items()}
    for key in ('character_start_times_seconds', 'character_end_times_seconds'):
        al[key] = [t + sum(g for a, g in gaps if t >= a) for t in alignment[key]]
    return np.concatenate(pieces), al, late


def recap_fragment(y, chars, w0, w1, max_s=1.9):
    """Кусок обработанной реплики от слова w0 до слова w1 (включительно) с короткими спадами; None — вся реплика."""
    words, cur, tag = [], None, False
    for i, ch in enumerate(chars):
        c = ch['c']
        if c == '[':
            tag = True
        if not tag and c.isalpha():
            nxt = chars[i + 1]['t'] if i + 1 < len(chars) else ch['t'] + 0.12
            cur = [cur[0] + c, cur[1], nxt] if cur else [c, ch['t'], nxt]
        elif cur:
            words.append(cur)
            cur = None
        if c == ']':
            tag = False
    if cur:
        words.append(cur)
    if w0 is None:
        a = max(0.0, (words[0][1] if words else 0) - 0.35)
        b = min(len(y) / SR, a + max_s)
    else:
        i0 = next(i for i, w in enumerate(words) if _norm(w[0]) == _norm(w0))
        i1 = next(i for i in range(i0, len(words)) if _norm(words[i][0]) == _norm(w1))
        a, b = max(0.0, words[i0][1] - 0.06), min(len(y) / SR, words[i1][2] + 0.3)
    seg = y[int(a * SR):int(b * SR)].copy()
    n = min(int(0.025 * SR), len(seg) // 4)
    ramp = np.linspace(0, 1, n)
    seg[:n] = (seg[:n].T * ramp).T
    seg[-n:] = (seg[-n:].T * ramp[::-1]).T
    frag_chars = [{'c': ch['c'], 't': round(ch['t'] - a, 3)} for ch in chars if a - 0.01 <= ch['t'] <= b]
    return seg, frag_chars


def chars_from(alignment, shift, keep=None):
    if not alignment:
        return []
    out = []
    for i, (c, t) in enumerate(zip(alignment['characters'], alignment['character_start_times_seconds'])):
        if keep and not (keep[0] <= t <= keep[1]):
            continue
        out.append({'c': c, 't': round(max(0.0, t - shift), 3)})
    return out


def load_raw(line_id):
    ep = int(line_id[1])
    base = TRIMMED if os.path.exists(os.path.join(TRIMMED, f'ep{ep}', f'{line_id}.wav')) else RAW
    wav = os.path.join(base, f'ep{ep}', f'{line_id}.wav')
    meta = os.path.join(base, f'ep{ep}', f'{line_id}.json')
    if not os.path.exists(wav):
        return None, None
    x, sr = sf.read(wav, dtype='float32', always_2d=False)
    if x.ndim > 1:
        x = x.mean(axis=1)
    if sr != SR:
        x = signal.resample_poly(x, SR, sr)
    al = None
    if os.path.exists(meta):
        with open(meta, encoding='utf-8') as f:
            al = json.load(f).get('alignment')
    return x.astype(np.float64), al


def run(ids=None):
    entries = {ep: [] for ep in range(1, 6)}
    report = []
    scenes_by_ep = {}
    done_lines = {}  # id → (обработанный сигнал, тайминг символов, персонаж) — для фрагментов «РАНЕЕ»
    missing = []
    for line in LINES:
        src_id = line.reuse or line.id
        x, al = load_raw(src_id)
        if x is None:
            missing.append(line.id)
            continue
        keep = None
        frag_shift = 0.0
        if line.fx == 'STREET_PA':
            x, frag_shift = street_fragment(x, al)
            keep = (frag_shift, frag_shift + len(x) / SR)
        out_rel = f'voice/ep{line.ep}/{line.id}.wav'
        out_abs = os.path.join(ROOT, 'public', out_rel)
        scene_end = None
        if line.scene:
            scenes = scenes_by_ep.setdefault(line.ep, scene_times(line.ep))
            if line.scene not in scenes:
                raise ValueError(f'{line.id}: нет сцены {line.scene} в ep{line.ep}/timing.ts')
            s0, scene_end = scenes[line.scene]
            first_at = s0 + line.pos
            if line.at and al:
                x, al, late = place_words(x, al, first_at, {w: s0 + t for w, t in line.at.items()})
                for w, d in late:
                    report.append(f'{line.id}: «{w}» ' + ('не найдено в генерации' if d is None else f'опаздывает на {d:.2f} с'))
        y, shift = process_line(line, x, al)
        done_lines[line.id] = (y, chars_from(al, shift + frag_shift, keep), line.who)
        if ids is None or line.id in ids or not os.path.exists(out_abs):
            os.makedirs(os.path.dirname(out_abs), exist_ok=True)
            sf.write(out_abs, y.astype(np.float32), SR, subtype='PCM_16')
        dur_f = math.ceil(len(y) / SR * FPS)
        win_f = round((line.win[1] - line.win[0]) * FPS)
        start = round(line.win[0] * FPS)
        if scene_end is not None:
            sw = spoken_words(al) if al else []
            t_first = (sw[0][1] - shift) if sw else 0.0  # первое слово в обработанном файле (дыхание без слов — начало файла)
            start = round((first_at - t_first) * FPS)
            over = (start + dur_f) / FPS - scene_end
            if over > 0.3:
                report.append(f'{line.id}: заходит в следующую сцену на {over:.1f} с')
        entries[line.ep].append({
            'id': line.id, 'character': line.who, 'file': out_rel, 'startFrame': start, 'durationFrames': dur_f,
            **({} if line.duck else {'duck': False}),
            'chars': chars_from(al, shift + frag_shift, keep),
        })
        if scene_end is None and dur_f > win_f * 1.1 and win_f > FPS:
            report.append(f'{line.id}: {dur_f / FPS:.1f} с при окне {win_f / FPS:.1f} с — сцену нужно удлинить (§7.4)')
    # «РАНЕЕ» из фрагментов готовых реплик (0 кредитов)
    for ep, specs in RECAPS.items():
        scenes = scenes_by_ep.setdefault(ep, scene_times(ep))
        if 'recap' not in scenes or not entries[ep]:
            continue
        r0 = scenes['recap'][0]
        for i, (src, w0, w1) in enumerate(specs):
            if src not in done_lines:
                report.append(f'R{ep}-{i + 1}: нет {src}')
                continue
            y, chars, who = done_lines[src]
            seg, fc = recap_fragment(y, chars, w0, w1)
            rel = f'voice/ep{ep}/R{ep}-{i + 1}.wav'
            sf.write(os.path.join(ROOT, 'public', rel), seg.astype(np.float32), SR, subtype='PCM_16')
            entries[ep].append({'id': f'R{ep}-{i + 1}', 'character': who, 'file': rel, 'startFrame': round(r0 * FPS) + 60 * i + RECAP_LEAD,
                                'durationFrames': math.ceil(len(seg) / SR * FPS), 'chars': fc})
    for ep, items in entries.items():
        if not items:
            continue
        loose = [e['id'] for e in items if e['id'] in BY_ID and not BY_ID[e['id']].scene]  # не озвученные (нет файла) не мешают
        if loose:  # пока реплики серии не привязаны к сценам, серия остаётся без голоса — WAV готовы, voice.json не трогаем
            report.append(f'ep{ep}: voice.json не записан — нет привязки к сценам у {" ".join(loose)}')
            continue
        path = os.path.join(ROOT, 'src', 'episodes', f'ep{ep}', 'voice.json')
        with open(path, 'w', encoding='utf-8') as f:
            json.dump(sorted(items, key=lambda e: e['startFrame']), f, ensure_ascii=False, separators=(',', ':'))
            f.write('\n')
    if missing:
        report.insert(0, f'нет сырых файлов в voice/raw ({len(missing)}): {" ".join(missing)}')
    print('\n'.join(report) or 'все реплики обработаны')


# ─────────────────────────── самопроверка без API

def synth_voice(dur=3.0, f0=110, whisper=False, seed=0):
    """Грубая имитация речи: импульсный источник с интонацией, форманты, слоги, шипящие."""
    rng = np.random.default_rng(seed)
    n = int(dur * SR)
    t = np.arange(n) / SR
    pitch = f0 * (1 + 0.08 * np.sin(2 * math.pi * 0.7 * t) + 0.03 * np.sin(2 * math.pi * 3.1 * t))
    phase = np.cumsum(pitch / SR)
    src = rng.standard_normal(n) * 0.3 if whisper else signal.sawtooth(2 * math.pi * phase) + 0.02 * rng.standard_normal(n)
    y = np.zeros(n)
    for f, bw, g in [(600, 120, 1), (1200, 150, 0.6), (2600, 250, 0.3)]:
        y += g * bp(src, f - bw, f + bw, 2)
    syl = (np.sin(2 * math.pi * 4 * t) > -0.3).astype(float)
    syl = lp(syl, 30, 2)
    y *= np.clip(syl, 0, 1)
    for k in rng.integers(0, n - 4000, int(dur)):
        y[k:k + 3000] += bp(rng.standard_normal(3000), 4500, 8000, 2) * 0.4
    pad = np.zeros(int(0.5 * SR))
    return np.concatenate([pad, y / np.max(np.abs(y)) * 0.5, pad])


def selftest(out_dir):
    os.makedirs(out_dir, exist_ok=True)
    fake_al = None
    rows = []
    for code in ['DRY', 'CAR', 'CAR_DARK', 'TUNNEL', 'SHAFT', 'CAB', 'INTERCOM', 'RADIO_INTERCOM', 'STREET_PA', 'TSS']:
        line = Line(f'T-{code}', (0, 4), 'gleb', code, 'normal', 'test')
        x = synth_voice(3.0, 105)
        y, shift = process_line(line, x, fake_al)
        assert np.all(np.isfinite(y)), code
        sf.write(os.path.join(out_dir, f'{code}.wav'), y.astype(np.float32), SR, subtype='PCM_16')
        rows.append(f'{code:15s} {len(y) / SR:5.2f} с  {loudness(y):6.1f} LUFS  пик {true_peak_db(y):5.1f} dBTP  сдвиг {shift:+.3f} с')
    for lvl in LEVEL_DB:
        line = Line(f'T-{lvl}', (0, 4), 'gleb', 'DRY', lvl, 'test')
        y, _ = process_line(line, synth_voice(2.0, 105, whisper=lvl == 'whisper', seed=3), None)
        rows.append(f'level {lvl:9s} {loudness(y):6.1f} LUFS (цель {target_lufs(line):.1f})')
    choke = lowpass_choke(synth_voice(2.0), 6)
    sf.write(os.path.join(out_dir, 'choke.wav'), choke.astype(np.float32), SR, subtype='PCM_16')
    print('\n'.join(rows))


if __name__ == '__main__':
    args = sys.argv[1:]
    if args and args[0] == '--selftest':
        selftest(args[1] if len(args) > 1 else os.path.join(ROOT, 'out', 'voice_selftest'))
    else:
        run(set(args) or None)
