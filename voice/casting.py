#!/usr/bin/env python3
"""
Кастинг голосов (PEREGON_voice.md, §2.1). Нужен ELEVENLABS_API_KEY.

  python3 voice/casting.py                  # все роли
  python3 voice/casting.py gleb nina        # только эти
  python3 voice/casting.py --library 3      # сколько голосов библиотеки на роль добавлять в аккаунт (по умолчанию 3)
  python3 voice/casting.py --page           # только пересобрать voice/review/casting.html

На роль: голоса из библиотеки (язык ru + фильтры) и 3 варианта Voice Design по описанию; каждый кандидат читает
одну и ту же тестовую сцену. Автопроверка — высота, монотонность, артефакты. Итог — voice/review/casting.html.
Выбор делает человек: на странице отмечается по одному голосу на роль, кнопка сохраняет voices.json —
его нужно положить в voice/voices.json.
"""
import html
import json
import os
import sys

import soundfile as sf

sys.path.insert(0, os.path.dirname(__file__))
import el  # noqa: E402
import qa  # noqa: E402
from lines import CHARACTERS  # noqa: E402

ROOT = os.path.join(os.path.dirname(__file__), '..')
DIR = os.path.join(ROOT, 'voice', 'casting')
INDEX = os.path.join(DIR, 'candidates.json')


def settings_for(ch):
    # ориентир §2.2: стабильность ~0,45 (Глеб ~0,55), сходство ~0,8, стиль низкий, speaker boost, скорость 1,0
    return {'stability': ch.stability, 'similarity_boost': 0.8, 'style': 0.15, 'use_speaker_boost': True, 'speed': 1.0}


def save_pcm(path, pcm):
    os.makedirs(os.path.dirname(path), exist_ok=True)
    sf.write(path, el.pcm_to_float(pcm), el.SR, subtype='PCM_16')


def cast(role, model, n_library):
    ch = CHARACTERS[role]
    out = []
    # 1. библиотека
    f = dict(ch.search)
    found = el.shared_voices(**f)
    if len(found) < n_library:  # ослабить фильтры
        found += [v for v in el.shared_voices(gender=f.get('gender'), use_cases=f.get('use_cases')) if v not in found]
    for v in found[:n_library]:
        vid = el.add_shared_voice(v['public_owner_id'], v['voice_id'], f'PEREGON {ch.name} · {v.get("name", "")}'[:60])
        pcm, al, _ = el.tts(vid, ch.test, model, settings_for(ch), seed=7)
        path = os.path.join(DIR, role, f'lib_{vid}.wav')
        save_pcm(path, pcm)
        out.append({'kind': 'library', 'voice_id': vid, 'name': v.get('name'), 'description': v.get('description', ''),
                    'file': os.path.relpath(path, ROOT)})
    # 2. Voice Design: превью читают тестовую сцену
    for i, (gid, pcm) in enumerate(el.design(ch.design, ch.test, model)[:3]):
        path = os.path.join(DIR, role, f'design_{i + 1}.wav')
        save_pcm(path, pcm)
        out.append({'kind': 'design', 'generated_voice_id': gid, 'name': f'Voice Design {i + 1}', 'file': os.path.relpath(path, ROOT)})
    # 3. автопроверка
    for c in out:
        x, sr = qa.load(os.path.join(ROOT, c['file']))
        st = qa.stats(x, sr)
        lo, hi = ch.f0
        flags = []
        if hi and st['f0'] and not (lo * 0.9 <= st['f0'] <= hi * 1.15):
            flags.append(f'высота {st["f0"]:.0f} Гц вне {lo}–{hi}')
        if st['f0_st'] is not None and st['f0_st'] < qa.MONOTONE_ST:
            flags.append('монотонно')
        if qa.hf_artifacts(x, sr) > 30:
            flags.append('металл выше 6 кГц')
        c.update(st, flags=flags, settings=settings_for(ch))
    return out


PAGE = '''<!doctype html><meta charset="utf-8"><title>ПЕРЕГОН — кастинг</title>
<style>
body{{background:#101112;color:#ddd;font:14px/1.45 system-ui,sans-serif;margin:24px;max-width:1100px}}
.role{{border-top:1px solid #2a2c2e;padding:14px 0}}.c{{display:flex;gap:14px;align-items:center;padding:6px 0}}
.f{{color:#e8a33c}}small{{color:#999}}audio{{height:30px}}button{{font-size:16px;padding:8px 18px;margin-top:20px}}
blockquote{{color:#aaa;margin:6px 0 10px 0}}
</style>
<h1>ПЕРЕГОН — кастинг голосов</h1>
<p>Каждый кандидат читает тестовую сцену роли. Отметьте по одному голосу на роль и нажмите «Сохранить voices.json»;
файл положите в <code>voice/voices.json</code>. Автопроверка только подсказывает — решает слух.</p>
{body}
<button id="save">Сохранить voices.json</button>
<script>
const data = {data};
document.getElementById('save').onclick = () => {{
  const out = {{}};
  for (const role of Object.keys(data)) {{
    const sel = document.querySelector(`input[name="${{role}}"]:checked`);
    if (!sel) continue;
    const c = data[role][+sel.value];
    out[role] = {{voice_id: c.voice_id || null, generated_voice_id: c.generated_voice_id || null, kind: c.kind, name: c.name, settings: c.settings, f0: c.f0, centroid: c.centroid}};
  }}
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([JSON.stringify(out, null, 1)], {{type: 'application/json'}}));
  a.download = 'voices.json'; a.click();
}};
</script>'''


def page(cands):
    body = []
    for role, items in cands.items():
        ch = CHARACTERS[role]
        rows = []
        for i, c in enumerate(items):
            meta = f'{c["f0"]:.0f} Гц · разброс {c["f0_st"]:.1f} пт' if c.get('f0') else 'шёпот / нет высоты'
            flags = ''.join(f'<div class="f">{html.escape(f)}</div>' for f in c['flags'])
            rows.append(f'<label class="c"><input type="radio" name="{role}" value="{i}">'
                        f'<audio controls preload="none" src="../../{c["file"]}"></audio>'
                        f'<div><b>{html.escape(c["name"] or "")}</b> <small>{c["kind"]} · {meta}</small>{flags}</div></label>')
        body.append(f'<div class="role"><h2>{ch.name}</h2><small>цель: {ch.f0[0]}–{ch.f0[1]} Гц</small>'
                    f'<blockquote>{html.escape(ch.test)}</blockquote>{"".join(rows)}</div>')
    return PAGE.format(body=''.join(body), data=json.dumps(cands, ensure_ascii=False))


def main():
    args = sys.argv[1:]
    n_lib = int(args[args.index('--library') + 1]) if '--library' in args else 3
    roles = [a for a in args if a in CHARACTERS] or list(CHARACTERS)
    cands = {}
    if os.path.exists(INDEX):
        with open(INDEX, encoding='utf-8') as f:
            cands = json.load(f)
    if '--page' not in args:
        model = el.pick_model()
        print('модель:', model)
        for role in roles:
            print('роль:', role, flush=True)
            cands[role] = cast(role, model, n_lib)
            el.dump(INDEX, cands)
    os.makedirs(os.path.join(ROOT, 'voice', 'review'), exist_ok=True)
    with open(os.path.join(ROOT, 'voice', 'review', 'casting.html'), 'w', encoding='utf-8') as f:
        f.write(page(cands))
    print('готово: voice/review/casting.html — выбор за человеком')


if __name__ == '__main__':
    main()
