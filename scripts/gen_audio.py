#!/usr/bin/env python3
"""
Генератор звука для «ПЕРЕГОНА». Музыки нет: только синтезированные шумы, гул и щелчки.
Запуск: python3 scripts/gen_audio.py  → файлы в public/audio/*.wav
Детерминированно (фиксированный seed), повторный запуск даёт те же файлы.
"""
import os
import wave

import numpy as np
from scipy import signal

SR = 44100
OUT = os.path.join(os.path.dirname(__file__), '..', 'public', 'audio')
rng = np.random.default_rng(1847)


def t_axis(sec):
    return np.arange(int(SR * sec)) / SR


def lowpass(x, fc, order=4):
    b, a = signal.butter(order, fc / (SR / 2), 'low')
    return signal.lfilter(b, a, x, axis=0)


def highpass(x, fc, order=2):
    b, a = signal.butter(order, fc / (SR / 2), 'high')
    return signal.lfilter(b, a, x, axis=0)


def bandpass(x, lo, hi, order=2):
    b, a = signal.butter(order, [lo / (SR / 2), hi / (SR / 2)], 'band')
    return signal.lfilter(b, a, x, axis=0)


def resonator(x, f, q):
    """Двухполюсный резонатор (металл, стекло, корпус)."""
    w = 2 * np.pi * f / SR
    r = np.exp(-np.pi * f / (q * SR))
    b = [1 - r]
    a = [1, -2 * r * np.cos(w), r * r]
    return signal.lfilter(b, a, x)


def env_ar(n, attack, release):
    a = int(attack * SR)
    r = int(release * SR)
    e = np.ones(n)
    if a > 0:
        e[:a] = np.linspace(0, 1, a)
    if r > 0:
        e[-r:] = np.linspace(1, 0, r)
    return e


def norm(x, peak=0.9):
    m = np.max(np.abs(x)) + 1e-9
    return x / m * peak


def loopify(x, fade=0.4):
    """Бесшовная петля: конец плавно перетекает в начало."""
    n = int(fade * SR)
    head = x[:n].copy()
    tail = x[-n:].copy()
    ramp = np.linspace(0, 1, n)
    if x.ndim == 2:
        ramp = ramp[:, None]
    x = x[:-n].copy()
    x[:n] = head * ramp + tail * (1 - ramp)
    return x


def write(name, x, peak=0.9):
    x = norm(x, peak)
    path = os.path.join(OUT, name)
    data = (np.clip(x, -1, 1) * 32767).astype(np.int16)
    ch = 1 if data.ndim == 1 else data.shape[1]
    with wave.open(path, 'wb') as w:
        w.setnchannels(ch)
        w.setsampwidth(2)
        w.setframerate(SR)
        w.writeframes(data.tobytes())
    print(f'{name:28s} {len(x) / SR:6.2f} s  {ch}ch')


def click(len_s=0.004):
    n = int(len_s * SR)
    c = rng.standard_normal(n) * np.exp(-np.linspace(0, 9, n))
    c = highpass(c, 1200)
    return resonator(c, 3200, 8) * 0.6 + c


# ---------- ритм стыков рельсов ----------
def rails_loop():
    dur = 8.0
    t = t_axis(dur)
    x = np.zeros_like(t)
    # фон: качение колёс — низкий шум
    rumble = lowpass(rng.standard_normal(len(t)), 180) * 0.5 + lowpass(rng.standard_normal(len(t)), 60) * 0.8
    x += rumble
    # «та-дам … та-дам»: две тележки, период ~1 с
    period = 1.0
    for k in range(int(dur / period)):
        for off in (0.0, 0.14, 0.52, 0.66):
            i0 = int((k * period + off) * SR)
            n = int(0.25 * SR)
            if i0 + n > len(t):
                continue
            tt = np.arange(n) / SR
            thump = np.sin(2 * np.pi * 62 * tt) * np.exp(-tt * 28)
            clack = resonator(rng.standard_normal(n) * np.exp(-tt * 70), 1350, 6) * 0.5
            x[i0:i0 + n] += thump * 1.6 + clack
    # скрип металла по металлу — слабые резонансы
    x += resonator(rng.standard_normal(len(t)) * 0.02, 2600, 40) * (0.5 + 0.5 * np.sin(2 * np.pi * 0.13 * t))
    write('rails_loop.wav', loopify(x, 0.3), 0.8)


# ---------- гул туннеля 35–60 Гц ----------
def tunnel_drone():
    dur = 24.0
    t = t_axis(dur)
    x = np.zeros_like(t)
    for f, a, rate in ((36, 1.0, 0.05), (47, 0.7, 0.083), (58, 0.45, 0.125)):
        fm = 1.2 * np.sin(2 * np.pi * rate * 0.5 * t)
        phase = 2 * np.pi * np.cumsum(f + fm) / SR
        am = 0.75 + 0.25 * np.sin(2 * np.pi * rate * t + f)
        x += np.sin(phase) * a * am
    x += lowpass(rng.standard_normal(len(t)), 90) * 0.9
    x += bandpass(rng.standard_normal(len(t)), 200, 420) * 0.04 * (0.6 + 0.4 * np.sin(2 * np.pi * 0.04 * t))
    write('tunnel_drone.wav', loopify(x, 1.0), 0.85)


# ---------- дозиметр: пуассоновские щелчки ----------
GEIGER_TIMES = {}


def geiger(rate, name):
    dur = 20.0
    n = int(dur * SR)
    x = np.zeros(n)
    t = 0.0
    times = []
    while True:
        t += rng.exponential(1 / rate)
        if t >= dur - 0.01:
            break
        times.append(round(t, 4))
        c = click()
        i0 = int(t * SR)
        x[i0:i0 + len(c)] += c * (0.7 + 0.3 * rng.random())
    if rate >= 40:
        x += highpass(rng.standard_normal(n), 3000) * 0.01 * min(1.0, rate / 200)
    write(name, x, 0.8)
    GEIGER_TIMES[name] = times


def write_geiger_times():
    """Моменты щелчков — чтобы индикатор на дозиметре мигал синхронно со звуком."""
    import json
    path = os.path.join(os.path.dirname(__file__), '..', 'src', 'audio', 'geigerTimes.json')
    os.makedirs(os.path.dirname(path), exist_ok=True)
    slim = {k: v[:2000] for k, v in GEIGER_TIMES.items()}
    with open(path, 'w') as f:
        json.dump(slim, f)
    print('geigerTimes.json written')


# ---------- инфразвуковой удар + треск стекла ----------
def boom():
    dur = 7.0
    t = t_axis(dur)
    f = 42 * np.exp(-t * 0.6) + 16
    body = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 0.55)
    rumble = lowpass(rng.standard_normal(len(t)), 120) * np.exp(-t * 0.45) * 1.2
    blast = lowpass(rng.standard_normal(len(t)), 900) * np.exp(-t * 6) * 0.8
    x = body * 1.6 + rumble + blast
    # треск стекла: серия резких импульсов + высокие «звоны»
    for k in range(70):
        tt = 0.05 + rng.exponential(0.35)
        if tt > 3.5:
            continue
        n = int(0.12 * SR)
        i0 = int(tt * SR)
        burst = rng.standard_normal(n) * np.exp(-np.arange(n) / SR * 60)
        x[i0:i0 + n] += highpass(burst, 2500) * 0.35 * np.exp(-tt * 0.8)
        if k % 5 == 0:
            ping = resonator(burst * 0.3, rng.uniform(3500, 7500), 120)
            x[i0:i0 + n] += ping * 0.6
    write('boom.wav', x, 0.95)


# ---------- глухой стук под полом ----------
def knock():
    dur = 1.2
    t = t_axis(dur)
    x = np.sin(2 * np.pi * 78 * t) * np.exp(-t * 22) * 1.4
    x += lowpass(rng.standard_normal(len(t)) * np.exp(-t * 40), 400) * 0.7
    x += resonator(rng.standard_normal(len(t)) * np.exp(-t * 60) * 0.3, 160, 12)
    write('knock.wav', x, 0.9)


# ---------- гудок электропоезда ----------
def horn():
    dur = 12.0
    t = t_axis(dur)
    x = np.zeros_like(t)
    for f in (311.0, 370.0):
        vib = 1 + 0.002 * np.sin(2 * np.pi * 5.2 * t)
        x += signal.sawtooth(2 * np.pi * np.cumsum(f * vib) / SR)
    x = lowpass(x, 1800, 2)
    x += lowpass(x, 600) * 0.6
    x = np.tanh(x * 1.4)
    x *= env_ar(len(t), 0.08, 0.5)
    write('horn.wav', x, 0.92)


# ---------- сердцебиение ----------
def heartbeat():
    dur = 6.0
    t = t_axis(dur)
    x = np.zeros_like(t)
    period = 60 / 66
    for k in range(int(dur / period) + 1):
        for off, a in ((0.0, 1.0), (0.28, 0.65)):
            i0 = int((k * period + off) * SR)
            n = int(0.2 * SR)
            if i0 + n > len(t):
                continue
            tt = np.arange(n) / SR
            x[i0:i0 + n] += np.sin(2 * np.pi * 52 * tt) * np.exp(-tt * 26) * a
    x = lowpass(x, 140)
    write('heartbeat.wav', x, 0.9)


# ---------- дыхание вплотную ----------
def breath(stereo_left=False):
    dur = 8.0
    t = t_axis(dur)
    x = np.zeros_like(t)
    period = 3.6
    for k in range(int(dur / period) + 1):
        for off, ln, a, lo, hi in ((0.0, 1.3, 0.8, 400, 2400), (1.5, 1.6, 1.0, 250, 1800)):
            i0 = int((k * period + off) * SR)
            n = int(ln * SR)
            if i0 + n > len(t):
                n = len(t) - i0
            if n <= 0:
                continue
            e = np.sin(np.linspace(0, np.pi, n)) ** 1.5
            x[i0:i0 + n] += bandpass(rng.standard_normal(n), lo, hi) * e * a
    x = loopify(x, 0.2)
    if stereo_left:
        st = np.stack([x * 1.0, x * 0.18], axis=1)
        write('breath_close_left.wav', st, 0.85)
    else:
        write('breath_close.wav', x, 0.85)


# ---------- скрежет металла по металлу ----------
def scrape():
    dur = 4.0
    t = t_axis(dur)
    n = len(t)
    src = rng.standard_normal(n) * (0.4 + 0.6 * np.abs(np.sin(2 * np.pi * 1.7 * t)))
    x = np.zeros(n)
    for f, q in ((820, 40), (1430, 60), (2210, 80), (3170, 90)):
        # «плывущий» тон: перекрёстное затухание двух слегка расстроенных резонаторов
        mixk = 0.5 + 0.5 * np.sin(2 * np.pi * 0.6 * t)
        x += resonator(src, f, q) * mixk + resonator(src, f * 1.03, q) * (1 - mixk)
    x += bandpass(src, 300, 900) * 0.3
    x *= env_ar(n, 0.4, 1.2)
    write('scrape.wav', x, 0.85)


# ---------- радиошум + обрывистый тон оповещения ----------
def announcement_bed():
    dur = 12.0
    t = t_axis(dur)
    n = len(t)
    hiss = bandpass(rng.standard_normal(n), 400, 3800) * 0.35
    gate = np.repeat(rng.random(int(dur * 18)) > 0.35, int(SR / 18) + 1)[:n]
    crackle = np.zeros(n)
    for _ in range(260):
        i0 = rng.integers(0, n - 200)
        crackle[i0:i0 + 120] += rng.standard_normal(120) * np.exp(-np.arange(120) / 25)
    x = hiss * (0.5 + 0.5 * gate) + highpass(crackle, 1500) * 0.6
    # тон оповещения: два тона, обрывается
    for start in (0.6, 5.2, 9.1):
        for k, f in enumerate((880, 660, 880)):
            i0 = int((start + k * 0.32) * SR)
            ln = int(0.26 * SR)
            if rng.random() < 0.25:
                ln = int(0.09 * SR)
            if i0 + ln > n:
                continue
            tt = np.arange(ln) / SR
            x[i0:i0 + ln] += np.sin(2 * np.pi * f * tt) * 0.45 * env_ar(ln, 0.01, 0.03)
    # «голос» диктора угадывается как модулированная полоса — без синтеза речи
    voice = bandpass(rng.standard_normal(n), 300, 1400)
    syll = (np.sin(2 * np.pi * 4.3 * t) > 0.2) * (np.sin(2 * np.pi * 0.31 * t) > -0.3)
    x += voice * lowpass(syll.astype(float), 20) * 0.25
    write('announcement_bed.wav', x, 0.75)


# ---------- дополнительные звуки ----------
def glass_squeak():
    dur = 1.6
    t = t_axis(dur)
    f = 900 + 500 * np.sin(2 * np.pi * 0.7 * t) + 80 * np.sin(2 * np.pi * 17 * t)
    stick = (np.sin(2 * np.pi * 23 * t) > 0.4).astype(float)
    x = signal.sawtooth(2 * np.pi * np.cumsum(f) / SR, 0.3) * lowpass(stick, 60)
    x = bandpass(x, 700, 4500) * env_ar(len(t), 0.05, 0.3)
    write('glass_squeak.wav', x, 0.7)


def cry_short(name, f0, dur, muffle):
    t = t_axis(dur)
    f = f0 * (1 + 0.25 * np.sin(np.pi * t / dur)) + 12 * np.sin(2 * np.pi * 6 * t)
    src = signal.sawtooth(2 * np.pi * np.cumsum(f) / SR) + rng.standard_normal(len(t)) * 0.3
    x = np.zeros_like(t)
    for fm, q, a in ((750, 6, 1.0), (1150, 8, 0.7), (2600, 10, 0.3)):
        x += resonator(src, fm, q) * a
    if muffle:
        x = lowpass(x, 500)
    x *= env_ar(len(t), 0.02, 0.05)
    write(name, x, 0.8)


def shuffle():
    dur = 6.0
    t = t_axis(dur)
    x = np.zeros_like(t)
    for k in range(int(dur / 0.6)):
        i0 = int((k * 0.6 + rng.uniform(0, 0.05)) * SR)
        n = int(0.35 * SR)
        if i0 + n > len(t):
            continue
        e = np.sin(np.linspace(0, np.pi, n)) ** 2
        x[i0:i0 + n] += bandpass(rng.standard_normal(n), 150, 1200) * e
    write('shuffle.wav', loopify(x, 0.2), 0.7)


def drip():
    dur = 0.5
    t = t_axis(dur)
    f = 1400 * np.exp(-t * 6) + 700
    x = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 30)
    write('drip.wav', x, 0.6)


def white_hit():
    """Короткий удар звука на склейке после хука."""
    dur = 2.5
    t = t_axis(dur)
    x = np.sin(2 * np.pi * np.cumsum(55 * np.exp(-t * 1.5) + 28) / SR) * np.exp(-t * 2.2) * 1.4
    x += lowpass(rng.standard_normal(len(t)), 300) * np.exp(-t * 3)
    x += highpass(rng.standard_normal(len(t)), 4000) * np.exp(-t * 25) * 0.3
    write('hit.wav', x, 0.95)


def noise_cut():
    """Шумная склейка для блока «РАНЕЕ»."""
    dur = 0.4
    t = t_axis(dur)
    x = bandpass(rng.standard_normal(len(t)), 600, 6000) * env_ar(len(t), 0.005, 0.25)
    write('noise_cut.wav', x, 0.6)


if __name__ == '__main__':
    os.makedirs(OUT, exist_ok=True)
    rails_loop()
    tunnel_drone()
    for r, nm in ((0.5, 'geiger_0_5.wav'), (2, 'geiger_2.wav'), (8, 'geiger_8.wav'), (40, 'geiger_40.wav'), (200, 'geiger_200.wav')):
        geiger(r, nm)
    write_geiger_times()
    boom()
    knock()
    horn()
    heartbeat()
    breath(False)
    breath(True)
    scrape()
    announcement_bed()
    glass_squeak()
    cry_short('cry_short.wav', 420, 0.55, False)
    cry_short('scream_muffled.wav', 380, 2.2, True)
    cry_short('scream.wav', 460, 1.4, False)
    shuffle()
    drip()
    white_hit()
    noise_cut()
