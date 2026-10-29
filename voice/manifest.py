#!/usr/bin/env python3
"""
Инвентаризация озвучки (патч №1, §0): что уже сгенерировано и не должно генерироваться повторно.

  python3 voice/manifest.py      # → voice/manifest.json

Для каждого ID из lines.py: есть ли сырой файл, текст, voice_id, seed, request_id, длительность, флаги проверки.
"""
import json
import os
import sys

import soundfile as sf

sys.path.insert(0, os.path.dirname(__file__))
from lines import LINES, plain  # noqa: E402

ROOT = os.path.join(os.path.dirname(__file__), '..')
OUT = os.path.join(ROOT, 'voice', 'manifest.json')


def build():
    out = {}
    for l in LINES:
        src = l.reuse or l.id
        wav = os.path.join(ROOT, 'voice', 'raw', f'ep{src[1]}', f'{src}.wav')
        meta_p = wav[:-4] + '.json'
        e = {'ep': l.ep, 'who': l.who, 'text': l.text or None, 'spoken': plain(l.text) or None, 'new': l.new, 'prio': l.prio,
             'reuse': l.reuse, 'exists': os.path.exists(wav)}
        if e['exists']:
            meta = json.load(open(meta_p, encoding='utf-8')) if os.path.exists(meta_p) else {}
            e.update(file=os.path.relpath(wav, ROOT), dur=round(sf.info(wav).duration, 2), voice_id=meta.get('voice_id'),
                     model=meta.get('model'), seed=meta.get('seed'), request_id=meta.get('request_id'),
                     flags=(meta.get('qa') or {}).get('flags', []))
        out[l.id] = e
    return out


def done(line_id):
    """Есть ли уже генерация — тогда её не трогаем."""
    src = next((l.reuse or l.id for l in LINES if l.id == line_id), line_id)
    return os.path.exists(os.path.join(ROOT, 'voice', 'raw', f'ep{src[1]}', f'{src}.wav'))


if __name__ == '__main__':
    m = build()
    with open(OUT, 'w', encoding='utf-8') as f:
        json.dump(m, f, ensure_ascii=False, indent=1)
    have = [k for k, v in m.items() if v['exists']]
    todo = [k for k, v in m.items() if not v['exists']]
    print(f'озвучено {len(have)}, нет файла {len(todo)}: {" ".join(todo)}')
    plus = [k for k, v in m.items() if v['new'] and not v['prio']]
    print('(+) из прошлой версии:', ' '.join(f'{k}{"✓" if m[k]["exists"] else "✗"}' for k in plus))
