#!/usr/bin/env python3
"""
Сборка out/peregon_full.mp4 без повторного рендера всех 27000 кадров.

FullFilm отличается от отдельных серий только там, где пропс standalone=false меняет картинку:
блоки «РАНЕЕ» (→ пауза-переход), таймкоды с припиской «за N до этого» и карточки серий.
Эти куски рендерятся из композиции FullFilm (`npx remotion render FullFilm --frames=…`),
остальное берётся из уже отрендеренных out/ep0N.mp4; склейка — покадрово точная (trim/atrim) с перекодированием.

Запуск после рендера серий:  python3 scripts/fullfilm_splice.py
Полностью честный вариант (дольше в ~5 раз): npx remotion render FullFilm out/peregon_full.mp4 --codec h264 --crf 18
"""
import os
import subprocess
import sys

FPS = 30
EP = 5400
ROOT = os.path.join(os.path.dirname(__file__), '..')
OUT = os.path.join(ROOT, 'out')
PARTS = os.path.join(OUT, 'parts')

# Кадры серии (начало включительно, конец не включительно), которые в FullFilm другие.
DIFF = {
    1: [(5100, 5400)],               # карточка серии
    2: [(180, 1050), (5100, 5400)],  # РАНЕЕ + лагерь (таймкод), карточка
    3: [(180, 1200), (5250, 5400)],  # РАНЕЕ + кабина (таймкод), карточка
    4: [(180, 1200), (5100, 5400)],  # РАНЕЕ + два дозиметра (таймкод), карточка
    5: [(180, 1200)],                # РАНЕЕ + капля крови (таймкод); «Конец» есть всегда
}


def run(cmd):
    print('$', ' '.join(cmd), flush=True)
    subprocess.run(cmd, check=True, cwd=ROOT)


def main():
    os.makedirs(PARTS, exist_ok=True)
    for ep in range(1, 6):
        if not os.path.exists(os.path.join(OUT, f'ep0{ep}.mp4')):
            sys.exit(f'нет out/ep0{ep}.mp4 — сначала отрендерите серии')

    # 1. кусочки FullFilm
    segments = []  # (файл, кадр начала, кадр конца) — по порядку фильма
    for ep in range(1, 6):
        off = (ep - 1) * EP
        t = 0
        for a, b in DIFF[ep]:
            if a > t:
                segments.append((f'out/ep0{ep}.mp4', t, a))
            part = f'out/parts/ff_ep{ep}_{a}_{b}.mp4'
            if not os.path.exists(os.path.join(ROOT, part)):
                run(['npx', 'remotion', 'render', 'FullFilm', part, f'--frames={off + a}-{off + b - 1}', '--codec', 'h264', '--crf', '18', '--log=error'])
            segments.append((part, 0, b - a))
            t = b
        if t < EP:
            segments.append((f'out/ep0{ep}.mp4', t, EP))

    # 2. покадровая склейка
    files = []
    for f, _, _ in segments:
        if f not in files:
            files.append(f)
    cmd = ['ffmpeg', '-y']
    for f in files:
        cmd += ['-i', f]
    chains = []
    labels = []
    for i, (f, a, b) in enumerate(segments):
        k = files.index(f)
        chains.append(f'[{k}:v]trim=start_frame={a}:end_frame={b},setpts=PTS-STARTPTS[v{i}]')
        chains.append(f'[{k}:a]atrim=start={a / FPS:.6f}:end={b / FPS:.6f},asetpts=PTS-STARTPTS[a{i}]')
        labels.append(f'[v{i}][a{i}]')
    graph = ';'.join(chains) + ';' + ''.join(labels) + f'concat=n={len(segments)}:v=1:a=1[v][a]'
    cmd += ['-filter_complex', graph, '-map', '[v]', '-map', '[a]',
            '-c:v', 'libx264', '-crf', '18', '-preset', 'medium', '-pix_fmt', 'yuv420p', '-r', str(FPS),
            '-c:a', 'aac', '-b:a', '320k', '-movflags', '+faststart', 'out/peregon_full.mp4']
    run(cmd)
    total = sum(b - a for _, a, b in segments)
    print(f'готово: {total} кадров ({total / FPS / 60:.1f} мин)')


if __name__ == '__main__':
    main()
