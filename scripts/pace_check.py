#!/usr/bin/env python3
"""
Проверка темпа (патч №1, §1 и §6.8): участки длиннее 2,5 с без нового события в готовой серии.

  python3 scripts/pace_check.py out/ep01.mp4 1      # видео серии и её номер (для voice.json)

Событие — что-то, что зритель замечает:
  • начало слова в озвучке (src/episodes/epN/voice.json, тайминг символов);
  • звуковое событие в миксе: уровень за 30 мс поднимается на 8 дБ над минимумом предыдущих 0,3 с;
  • заметная смена в кадре: в каком-либо из 12×8 участков кадра яркость меняется сильнее порога
    (склейка, вспышка, появившаяся цифра или строка текста, гаснущий фонарь).
Плавный наезд камеры и шум зерна событиями не считаются.
"""
import json
import os
import subprocess
import sys

import numpy as np

FPS = 30
GAP = 2.5
W, H = 192, 108
BX, BY = 12, 8
ROOT = os.path.join(os.path.dirname(__file__), '..')


def video_events(path, thresh=7.0):
    raw = subprocess.run(['ffmpeg', '-v', 'error', '-i', path, '-vf', f'scale={W}:{H},format=gray', '-f', 'rawvideo', '-'],
                         capture_output=True, check=True).stdout
    v = np.frombuffer(raw, np.uint8).reshape(-1, H, W).astype(np.float32)
    # среднее по участкам, затем разница с кадром 3 кадра назад (плавные изменения не набирают порог)
    blocks = v.reshape(len(v), BY, H // BY, BX, W // BX).mean(axis=(2, 4))
    d = np.abs(blocks[3:] - blocks[:-3]).max(axis=(1, 2))
    return [i + 3 for i in np.where(d > thresh)[0]], len(v)


def audio_events(path):
    raw = subprocess.run(['ffmpeg', '-v', 'error', '-i', path, '-vn', '-ac', '1', '-ar', '16000', '-f', 'f32le', '-'],
                         capture_output=True, check=True).stdout
    x = np.frombuffer(raw, np.float32)
    hop = 480  # 30 мс
    n = len(x) // hop
    lvl = 10 * np.log10(np.mean(x[:n * hop].reshape(n, hop) ** 2, axis=1) + 1e-10)
    out = []
    for i in range(10, n):
        if lvl[i] > -45 and lvl[i] - lvl[i - 10:i].min() > 8:
            out.append(int(i * hop / 16000 * FPS))
    return out


def speech_events(ep):
    p = os.path.join(ROOT, 'src', 'episodes', f'ep{ep}', 'voice.json')
    out = []
    for e in json.load(open(p, encoding='utf-8')):
        prev = ' '
        tag = False
        for c in e['chars']:
            if c['c'] == '[':
                tag = True
            if not tag and c['c'].isalpha() and not prev.isalpha():
                out.append(e['startFrame'] + int(c['t'] * FPS))
            if c['c'] == ']':
                tag = False
            prev = c['c']
    return out


def tc(f):
    s = f / FPS
    return f'{int(s // 60)}:{s % 60:04.1f}'


def main():
    path, ep = sys.argv[1], int(sys.argv[2])
    vid, total = video_events(path)
    ev = sorted(set(vid) | set(audio_events(path)) | set(speech_events(ep)) | {0, total})
    gaps = [(a, b) for a, b in zip(ev, ev[1:]) if (b - a) / FPS > GAP]
    print(f'{path}: {total / FPS:.1f} с, событий {len(ev)}')
    if not gaps:
        print(f'участков длиннее {GAP} с без события нет')
    for a, b in gaps:
        print(f'  {tc(a)}–{tc(b)}: {(b - a) / FPS:.1f} с без события')


if __name__ == '__main__':
    main()
