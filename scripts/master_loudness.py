#!/usr/bin/env python3
"""
Финальная громкость (PEREGON_voice.md, §5.3): −16 LUFS интегрально, пик не выше −1 dBTP.
Двухпроходный loudnorm по звуку готового видео, картинка копируется без перекодирования.

  python3 scripts/master_loudness.py out/ep01.mp4 [out/ep02.mp4 …]   # пишет рядом *_master.mp4
"""
import json
import os
import re
import subprocess
import sys

TARGET = 'I=-16:TP=-1.5:LRA=11'  # запас 0,5 дБ: AAC слегка поднимает пики


def measure(path):
    r = subprocess.run(['ffmpeg', '-hide_banner', '-nostats', '-i', path, '-map', '0:a', '-af',
                        f'loudnorm={TARGET}:print_format=json', '-f', 'null', '-'], capture_output=True, text=True)
    return json.loads(re.search(r'\{[^{}]+\}\s*$', r.stderr).group(0))


def master(path):
    m = measure(path)
    out = re.sub(r'\.mp4$', '_master.mp4', path)
    af = (f'loudnorm={TARGET}:measured_I={m["input_i"]}:measured_TP={m["input_tp"]}:measured_LRA={m["input_lra"]}'
          f':measured_thresh={m["input_thresh"]}:offset={m["target_offset"]}:linear=true')
    subprocess.run(['ffmpeg', '-y', '-v', 'error', '-i', path, '-map', '0:v', '-map', '0:a', '-c:v', 'copy', '-af', af,
                    '-ar', '48000', '-c:a', 'aac', '-b:a', '320k', '-movflags', '+faststart', out], check=True)
    after = measure(out)
    print(f'{os.path.basename(path)}: {m["input_i"]} → {after["input_i"]} LUFS, пик {after["input_tp"]} dBTP → {out}')


if __name__ == '__main__':
    for p in sys.argv[1:]:
        master(p)
