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
# Длительность серий в кадрах — как в src/episodes/durations.ts (все серии после патча №1).
EP_FRAMES = {1: 4089, 2: 4284, 3: 3534, 4: 3711, 5: 4047}


def ep_offset(ep):
    return sum(EP_FRAMES[e] for e in range(1, ep))
ROOT = os.path.join(os.path.dirname(__file__), '..')
OUT = os.path.join(ROOT, 'out')
PARTS = os.path.join(OUT, 'parts')

# Кадры серии (начало включительно, конец не включительно), которые в FullFilm другие.
DIFF = {
    1: [(3984, 4089)],               # чёрный + карточка серии
    2: [(180, 1080), (4179, 4284)],  # РАНЕЕ + лагерь (таймкод), чёрный + карточка
    3: [(222, 927), (3459, 3534)],   # РАНЕЕ + кабина (таймкод), карточка
    4: [(180, 915), (3606, 3711)],   # РАНЕЕ + два дозиметра (таймкод), карточка
    5: [(180, 774)],                 # РАНЕЕ + капля крови (таймкод); «Конец» есть всегда
}


def run(cmd):
    print('$', ' '.join(cmd), flush=True)
    subprocess.run(cmd, check=True, cwd=ROOT)


def has_audio(path):
    r = subprocess.run(['ffprobe', '-v', 'error', '-select_streams', 'a', '-show_entries', 'stream=index', '-of', 'csv=p=0', path],
                       cwd=ROOT, capture_output=True, text=True)
    return bool(r.stdout.strip())


def main():
    os.makedirs(PARTS, exist_ok=True)
    for ep in range(1, 6):
        if not os.path.exists(os.path.join(OUT, f'ep0{ep}.mp4')):
            sys.exit(f'нет out/ep0{ep}.mp4 — сначала отрендерите серии')

    # 1. кусочки FullFilm
    segments = []  # (файл, кадр начала, кадр конца) — по порядку фильма
    for ep in range(1, 6):
        off = ep_offset(ep)
        t = 0
        for a, b in DIFF[ep]:
            if a > t:
                segments.append((f'out/ep0{ep}.mp4', t, a))
            part = f'out/parts/ff_ep{ep}_{a}_{b}.mp4'
            if not os.path.exists(os.path.join(ROOT, part)):
                run(['npx', 'remotion', 'render', 'FullFilm', part, f'--frames={off + a}-{off + b - 1}', '--codec', 'h264', '--crf', '18', '--log=error'])
            segments.append((part, 0, b - a))
            t = b
        if t < EP_FRAMES[ep]:
            segments.append((f'out/ep0{ep}.mp4', t, EP_FRAMES[ep]))

    # 2. покадровая склейка
    # у каждого куска свой вход: один и тот же поток в filter_complex можно взять только один раз
    cmd = ['ffmpeg', '-y', '-v', 'error']
    for f, _, _ in segments:
        cmd += ['-i', f]
    chains = []
    labels = []
    for i, (f, a, b) in enumerate(segments):
        k = i
        chains.append(f'[{k}:v]trim=start_frame={a}:end_frame={b},setpts=PTS-STARTPTS[v{i}]')
        if has_audio(f):
            chains.append(f'[{k}:a]atrim=start={a / FPS:.6f}:end={b / FPS:.6f},asetpts=PTS-STARTPTS[a{i}]')
        else:
            # Remotion не пишет звуковую дорожку в полностью тихий кусок — подставляем тишину
            chains.append(f'anullsrc=r=48000:cl=stereo,atrim=duration={(b - a) / FPS:.6f},asetpts=PTS-STARTPTS[a{i}]')
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
