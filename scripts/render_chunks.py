#!/usr/bin/env python3
"""
Возобновляемый рендер кусками: каждый кусок (по умолчанию 900 кадров) пишется во временный файл
и переименовывается только после успеха — перезапуск продолжает с того места, где остановились.

  python3 scripts/render_chunks.py render Ep3 Ep4 Ep5 ff --worker 0 --workers 2   # очередь 0 из 2
  python3 scripts/render_chunks.py assemble Ep3 Ep4 Ep5                           # склейка кусков в out/ep0N.mp4

«ff» — кусочки композиции FullFilm, которые отличаются от отдельных серий (см. fullfilm_splice.py).
"""
import os
import subprocess
import sys

sys.path.insert(0, os.path.dirname(__file__))
from fullfilm_splice import DIFF, EP_FRAMES, FPS, ep_offset  # noqa: E402

ROOT = os.path.join(os.path.dirname(__file__), '..')
PARTS = os.path.join(ROOT, 'out', 'parts')
CHUNK = 900


def tasks(names):
    out = []
    for n in names:
        if n == 'ff':
            for ep, ranges in DIFF.items():
                off = ep_offset(ep)
                for a, b in ranges:
                    out.append(('FullFilm', off + a, off + b, f'out/parts/ff_ep{ep}_{a}_{b}.mp4'))
        else:
            ep_len = EP_FRAMES[int(n[2:])]
            for a in range(0, ep_len, CHUNK):
                b = min(ep_len, a + CHUNK)
                out.append((n, a, b, f'out/parts/{n}_{a:05d}.mp4'))
    return out


def render(names, worker, workers):
    os.makedirs(PARTS, exist_ok=True)
    for i, (comp, a, b, path) in enumerate(tasks(names)):
        if i % workers != worker or os.path.exists(os.path.join(ROOT, path)):
            continue
        tmp = path.replace('.mp4', '.part.mp4')
        cmd = ['npx', 'remotion', 'render', comp, tmp, f'--frames={a}-{b - 1}', '--codec', 'h264', '--crf', '18',
               '--concurrency=2', '--timeout=120000', '--log=error']
        print(f'[{worker}] {comp} {a}-{b}', flush=True)
        r = subprocess.run(cmd, cwd=ROOT)
        if r.returncode == 0:
            os.replace(os.path.join(ROOT, tmp), os.path.join(ROOT, path))
            print(f'[{worker}] ok {path}', flush=True)
        else:
            print(f'[{worker}] FAILED {path}', flush=True)


def assemble(names):
    for n in names:
        items = tasks([n])
        parts = [p for c, _, _, p in items]
        missing = [p for p in parts if not os.path.exists(os.path.join(ROOT, p))]
        if missing:
            print(f'{n}: не хватает {len(missing)} кусков')
            continue
        ep = int(n.replace('Ep', ''))
        cmd = ['ffmpeg', '-y', '-v', 'error']
        for p in parts:
            cmd += ['-i', p]
        # точная длина каждого куска: звук у кусков бывает чуть длиннее картинки
        chains = []
        for i, (_, a, b, _) in enumerate(items):
            chains.append(f'[{i}:v]trim=end_frame={b - a},setpts=PTS-STARTPTS[v{i}]')
            chains.append(f'[{i}:a]atrim=end={(b - a) / FPS:.6f},asetpts=PTS-STARTPTS[a{i}]')
        graph = ';'.join(chains) + ';' + ''.join(f'[v{i}][a{i}]' for i in range(len(parts))) + f'concat=n={len(parts)}:v=1:a=1[v][a]'
        cmd += ['-filter_complex', graph, '-map', '[v]', '-map', '[a]', '-c:v', 'libx264', '-crf', '18', '-preset', 'medium',
                '-pix_fmt', 'yuv420p', '-r', str(FPS), '-c:a', 'aac', '-b:a', '320k', '-movflags', '+faststart', f'out/ep0{ep}.mp4']
        print('$', n, flush=True)
        subprocess.run(cmd, check=True, cwd=ROOT)
        print(f'готово out/ep0{ep}.mp4', flush=True)


if __name__ == '__main__':
    mode = sys.argv[1]
    args = [a for a in sys.argv[2:] if not a.startswith('--')]
    if mode == 'render':
        w = int(sys.argv[sys.argv.index('--worker') + 1]) if '--worker' in sys.argv else 0
        ws = int(sys.argv[sys.argv.index('--workers') + 1]) if '--workers' in sys.argv else 1
        names = [a for a in args if not a.isdigit()]
        render(names, w, ws)
    else:
        assemble(args)
