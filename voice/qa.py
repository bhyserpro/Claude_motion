#!/usr/bin/env python3
"""
Автоматическая проверка реплик (PEREGON_voice.md, §6) и страница прослушивания voice/review/index.html.

  python3 voice/qa.py            # проверить все сгенерированные реплики, собрать отчёт
  python3 voice/qa.py --no-stt   # без распознавания речи (без сети)

Проверки: текст (Scribe STT, ≤ 5 % ошибочных символов, теги не произнесены), тембр (средняя высота ±12 %,
спектральный центроид ±15 % от эталона персонажа; для шёпота высота не проверяется), живость (разброс высоты
внутри фразы, узкие пики выше 6 кГц, щелчки и разрывы), техника (клиппинг, тишина по краям ≤ 300 мс),
хронометраж (окно из §4 ±10 %).
"""
import html
import json
import math
import os
import re
import sys

import numpy as np
import soundfile as sf

sys.path.insert(0, os.path.dirname(__file__))
from lines import BY_ID, CHARACTERS, LINES, Line, plain  # noqa: E402

ROOT = os.path.join(os.path.dirname(__file__), '..')
VOICE = os.path.join(ROOT, 'voice')
REF = os.path.join(VOICE, 'reference.json')
MONOTONE_ST = 1.2  # стандартное отклонение высоты внутри фразы, полутоны: ниже — подозрение на монотонность


def load(path):
    x, sr = sf.read(path, dtype='float32', always_2d=False)
    if x.ndim > 1:
        x = x.mean(axis=1)
    return x.astype(np.float64), sr


def f0_track(x, sr, fmin=60, fmax=320, hop=0.01, win=0.05):
    """Высота основного тона: автокорреляция (через БПФ) по кадрам 50 мс, только звонкие кадры."""
    n, h = int(win * sr), int(hop * sr)
    lo, hi = int(sr / fmax), int(sr / fmin)
    if len(x) < n + h:
        return np.array([])
    frames = np.lib.stride_tricks.sliding_window_view(x, n)[::h]
    frames = frames - frames.mean(axis=1, keepdims=True)
    loud = np.sqrt(np.mean(frames ** 2, axis=1)) > 10 ** (-45 / 20)
    frames = frames[loud] * np.hanning(n)
    if not len(frames):
        return np.array([])
    F = np.fft.rfft(frames, 2 * n, axis=1)
    r = np.fft.irfft(np.abs(F) ** 2, axis=1)[:, :n]
    w = np.fft.irfft(np.abs(np.fft.rfft(np.hanning(n), 2 * n)) ** 2)[:n]  # поправка на окно
    r = r / (r[:, :1] + 1e-12) / (w / w[0] + 1e-3)
    seg = r[:, lo:hi]
    k = np.argmax(seg, axis=1)
    peak = seg[np.arange(len(seg)), k]
    voiced = peak > 0.55
    return sr / (k[voiced] + lo)


def centroid(x, sr):
    P = np.abs(np.fft.rfft(x * np.hanning(len(x)))) ** 2
    f = np.fft.rfftfreq(len(x), 1 / sr)
    return float(np.sum(f * P) / (np.sum(P) + 1e-12))


def hf_artifacts(x, sr):
    """Металлические артефакты: узкие пики выше 6 кГц, сильно торчащие над соседями (дБ)."""
    n = 4096
    worst = 0.0
    for i in range(0, len(x) - n, n):
        P = 20 * np.log10(np.abs(np.fft.rfft(x[i:i + n] * np.hanning(n))) + 1e-9)
        f = np.fft.rfftfreq(n, 1 / sr)
        band = P[(f > 6000) & (f < 16000)]
        if len(band) < 20 or band.max() < -40:
            continue
        med = np.convolve(band, np.ones(31) / 31, mode='same')
        worst = max(worst, float(np.max(band - med)))
    return worst


def clicks(x, sr=44100):
    """Щелчки и разрывы волны: всплески второй разности, далеко выходящие за местный уровень (окно 20 мс)."""
    d2 = np.abs(x[2:] - 2 * x[1:-1] + x[:-2])
    k = int(0.02 * sr)
    local = np.sqrt(np.convolve(d2 ** 2, np.ones(k) / k, mode='same')) + 1e-9
    hits = np.where((d2 > 10 * local) & (d2 > 0.02))[0]
    # соседние отсчёты одного щелчка — один щелчок
    return int(np.sum(np.diff(hits) > k)) + (1 if len(hits) else 0)


def edge_silence(x, sr, thresh_db=-50):
    a = np.abs(x)
    idx = np.where(a > 10 ** (thresh_db / 20))[0]
    if not len(idx):
        return len(x) / sr, len(x) / sr
    return idx[0] / sr, (len(x) - idx[-1]) / sr


_UNITS = 'ноль один два три четыре пять шесть семь восемь девять десять одиннадцать двенадцать тринадцать четырнадцать ' \
         'пятнадцать шестнадцать семнадцать восемнадцать девятнадцать'.split()
_TENS = ' десять двадцать тридцать сорок пятьдесят шестьдесят семьдесят восемьдесят девяносто'.split(' ')
_HUNDREDS = ' сто двести триста четыреста пятьсот шестьсот семьсот восемьсот девятьсот'.split(' ')


def num_words(n: int) -> str:
    """0–999 словами (именительный падеж) — Scribe пишет числа цифрами, сценарий — словами."""
    if n < 20:
        return _UNITS[n]
    out = []
    if n >= 100:
        out.append(_HUNDREDS[n // 100])
        n %= 100
    if n >= 20:
        out.append(_TENS[n // 10])
        n %= 10
        if n:
            out.append(_UNITS[n])
    elif n:
        out.append(_UNITS[n])
    return ' '.join(out)


def cer(ref, hyp):
    hyp = re.sub(r'[\[(][^\])]*[\])]', ' ', hyp)  # пометки распознавателя: [вдох], (смех)
    hyp = re.sub(r'(\d+)[,.](\d)\b', lambda m: f'{m[1]} целых {m[2]}', hyp)
    hyp = re.sub(r'\d{1,3}', lambda m: f' {num_words(int(m[0]))} ', hyp)
    norm = lambda s: re.sub(r'\s+', ' ', re.sub(r'[^\w\s]', ' ', s.lower().replace('ё', 'е'))).strip()
    r, h = norm(ref), norm(hyp)
    if not r:
        return 0.0
    prev = list(range(len(h) + 1))
    for i, rc in enumerate(r, 1):
        cur = [i] + [0] * len(h)
        for j, hc in enumerate(h, 1):
            cur[j] = min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + (rc != hc))
        prev = cur
    return prev[-1] / len(r)


def stats(x, sr):
    f0 = f0_track(x, sr)
    semis = 12 * np.log2(f0 / np.median(f0)) if len(f0) > 5 else np.array([])
    return {
        'f0': float(np.median(f0)) if len(f0) > 5 else None,
        'f0_st': float(np.std(semis)) if len(semis) else None,
        'centroid': centroid(x, sr),
    }


def references():
    if os.path.exists(REF):
        with open(REF, encoding='utf-8') as f:
            return json.load(f)
    return {}


def check(line: Line, wav_path, *, stt=None, processed=False):
    """Оценка одной реплики. stt — функция wav→текст или None. Возвращает dict с флагами."""
    x, sr = load(wav_path)
    st = stats(x, sr)
    ref = references().get(line.who, {})
    flags = []
    res = {'id': line.id, 'dur': len(x) / sr, **st}
    whisper = line.level == 'whisper'
    spoken = plain(line.text)
    if stt and spoken and not set(spoken) <= set('. '):
        text = stt(wav_path)
        res['stt'] = text
        res['cer'] = cer(spoken, text)
        if res['cer'] > 0.05:
            flags.append(f'текст: {res["cer"] * 100:.0f} % ошибок')
        if re.search(r'[a-zA-Z]{3,}', text):
            flags.append('произнесён тег')
    if not whisper and not processed:
        if st['f0'] and ref.get('f0') and abs(st['f0'] / ref['f0'] - 1) > 0.12:
            flags.append(f'высота {st["f0"]:.0f} Гц при эталоне {ref["f0"]:.0f}')
        lo, hi = CHARACTERS[line.who].f0
        if st['f0'] and hi and not (lo * 0.85 <= st['f0'] <= hi * 1.25):
            flags.append(f'высота {st["f0"]:.0f} Гц вне {lo}–{hi}')
        if st['f0_st'] is not None and st['f0_st'] < MONOTONE_ST and res['dur'] > 1.5:
            flags.append(f'монотонно ({st["f0_st"]:.1f} пт)')
    if not processed and ref.get('centroid') and abs(st['centroid'] / ref['centroid'] - 1) > 0.15:
        flags.append(f'центроид {st["centroid"]:.0f} Гц при эталоне {ref["centroid"]:.0f}')
    res['hf_peak_db'] = hf_artifacts(x, sr)
    if res['hf_peak_db'] > 30:
        flags.append(f'металл выше 6 кГц (+{res["hf_peak_db"]:.0f} дБ)')
    res['clicks'] = clicks(x, sr)
    if res['clicks'] > 0:
        flags.append(f'щелчки: {res["clicks"]}')
    res['clip'] = int(np.sum(np.abs(x) >= 0.999))
    if res['clip']:
        flags.append(f'клиппинг: {res["clip"]} отсчётов')
    if not processed:
        a, b = edge_silence(x, sr)
        if a > 0.3 or b > 0.3:
            flags.append(f'тишина по краям {a:.2f}/{b:.2f} с')
        win = line.win[1] - line.win[0]
        if win >= 1.5 and res['dur'] > win * 1.1:
            flags.append(f'длина {res["dur"]:.1f} с при окне {win:.0f} с')
    res['flags'] = flags
    return res


def scribe():
    if not os.environ.get('ELEVENLABS_API_KEY'):
        return None
    import el
    return el.stt


PAGE = '''<!doctype html><meta charset="utf-8"><title>ПЕРЕГОН — проверка озвучки</title>
<style>
body{{background:#101112;color:#ddd;font:14px/1.4 system-ui,sans-serif;margin:24px}}
table{{border-collapse:collapse;width:100%}}td,th{{border-bottom:1px solid #2a2c2e;padding:6px 8px;vertical-align:top;text-align:left}}
.f{{color:#e8a33c}}.ok{{color:#7fb77e}}audio{{height:28px;width:220px}}.t{{color:#999;max-width:420px}}
code{{background:#1c1e20;padding:6px 8px;display:block;margin:12px 0;white-space:pre-wrap}}h2{{margin-top:32px}}
</style>
<h1>ПЕРЕГОН — проверка озвучки</h1>
<p>Сухая версия — из <code style="display:inline">voice/raw</code>, обработанная — из <code style="display:inline">public/voice</code>.
Отметьте реплики, которые нужно перегенерировать, и выполните команду внизу.</p>
{body}
<h2>Перегенерация</h2><code id="cmd">python3 voice/generate.py --redo</code>
<script>
const upd=()=>{{const ids=[...document.querySelectorAll('input.r:checked')].map(i=>i.value);
document.getElementById('cmd').textContent='python3 voice/generate.py --redo '+ids.join(' ')}};
document.querySelectorAll('input.r').forEach(i=>i.addEventListener('change',upd));
</script>'''


def page(results):
    body = []
    for ep in range(1, 6):
        rows = []
        for line in [l for l in LINES if l.ep == ep]:
            r = results.get(line.id)
            raw = f'../raw/ep{ep}/{line.reuse or line.id}.wav'
            pub = f'../../public/voice/ep{ep}/{line.id}.wav'
            hook = line.id.endswith('-01')
            flags = (r or {}).get('flags', ['нет файла']) + (r or {}).get('flags_processed', [])
            state = ''.join(f'<div class="f">{html.escape(f)}</div>' for f in flags) or '<span class="ok">ok</span>'
            extra = ' · <b>хук</b>' if hook else ''
            rows.append(
                f'<tr><td><input type="checkbox" class="r" value="{line.id}"> <b>{line.id}</b>{extra}<br>{CHARACTERS[line.who].name}'
                f'<br><small>{line.fx} · {line.level}</small></td>'
                f'<td class="t">{html.escape(plain(line.text) or "← " + str(line.reuse))}'
                f'{"<br><small>STT: " + html.escape(r["stt"]) + "</small>" if r and r.get("stt") else ""}</td>'
                f'<td>сухая<br><audio controls preload="none" src="{raw}"></audio></td>'
                f'<td>обработанная<br><audio controls preload="none" src="{pub}"></audio></td>'
                f'<td>{state}</td></tr>')
        body.append(f'<h2>Серия {ep}</h2><table>{"".join(rows)}</table>')
    return PAGE.format(body=''.join(body))


def main():
    stt = None if '--no-stt' in sys.argv else scribe()
    results = {}
    for line in LINES:
        ep = line.ep
        raw = os.path.join(VOICE, 'raw', f'ep{ep}', f'{line.reuse or line.id}.wav')
        pub = os.path.join(ROOT, 'public', 'voice', f'ep{ep}', f'{line.id}.wav')
        if os.path.exists(raw):
            results[line.id] = check(line, raw, stt=stt if not line.reuse else None)
        if os.path.exists(pub):
            p = check(line, pub, processed=True)
            results.setdefault(line.id, {'id': line.id, 'flags': []})['flags_processed'] = [f'обработка: {f}' for f in p['flags']]
    os.makedirs(os.path.join(VOICE, 'review'), exist_ok=True)
    with open(os.path.join(VOICE, 'review', 'qa.json'), 'w', encoding='utf-8') as f:
        json.dump(results, f, ensure_ascii=False, indent=1)
    with open(os.path.join(VOICE, 'review', 'index.html'), 'w', encoding='utf-8') as f:
        f.write(page(results))
    flagged = [k for k, v in results.items() if v.get('flags') or v.get('flags_processed')]
    print(f'проверено {len(results)}, с флагами {len(flagged)}: {" ".join(flagged)}')
    print('стт:', 'Scribe' if stt else 'пропущено')


if __name__ == '__main__':
    main()
