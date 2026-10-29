#!/usr/bin/env python3
"""
Генерация реплик (PEREGON_voice.md, §3–4, §8.4). Нужны ELEVENLABS_API_KEY и voice/voices.json (итог кастинга).

  python3 voice/generate.py                # всё, чего ещё нет в voice/raw
  python3 voice/generate.py --ep 2         # одна серия
  python3 voice/generate.py --redo E1-05 E2-03
  python3 voice/generate.py --choose E3-08 3   # выбрать вариант 3 из нескольких сгенерированных

Порядок внутри серии: монолог Глеба цепочкой (previous_request_ids, до трёх предыдущих — только на eleven_v4),
потом остальные реплики (короткие — с previous_text/next_text), потом диалоговые блоки (Text to Dialogue).
Каждая генерация проходит автопроверку (qa.check); не прошедшая — до 5 попыток с другим seed, затем флаг «слушать».
Результат: voice/raw/epN/<ID>.wav (сухой, 44,1 кГц) + <ID>.json (alignment, seed, модель, request_id, флаги).
"""
import json
import os
import shutil
import sys
import zlib

import soundfile as sf

sys.path.insert(0, os.path.dirname(__file__))
import el  # noqa: E402
import qa  # noqa: E402
from lines import CHARACTERS, LINES, Line, neighbours, plain  # noqa: E402

ROOT = os.path.join(os.path.dirname(__file__), '..')
RAW = os.path.join(ROOT, 'voice', 'raw')
VOICES = os.path.join(ROOT, 'voice', 'voices.json')
LOG = os.path.join(RAW, 'log.json')
ATTEMPTS = 3
# Перегенерировать имеет смысл только из-за брака, который слышно сразу: не тот текст, произнесённый тег, клиппинг.
# Остальные флаги (высота, монотонность, длина) — подсказка для прослушивания, на них символы не тратим.
RETRY_ON = ('текст:', 'произнесён тег', 'клиппинг')
RESERVE = 0  # сколько символов оставить нетронутыми (BUDGET_RESERVE в окружении)


def budget_left():
    used, limit = el.usage()
    return limit - used - int(os.environ.get('BUDGET_RESERVE', RESERVE))


def load_voices():
    if not os.path.exists(VOICES):
        sys.exit('нет voice/voices.json — сначала кастинг (voice/casting.py) и выбор голосов человеком')
    with open(VOICES, encoding='utf-8') as f:
        v = json.load(f)
    changed = False
    for role, c in v.items():
        if not c.get('voice_id') and c.get('generated_voice_id'):  # голос из Voice Design сохраняется в аккаунт один раз
            c['voice_id'] = el.save_designed(c['generated_voice_id'], f'PEREGON {CHARACTERS[role].name}', CHARACTERS[role].design)
            changed = True
    if changed:
        el.dump(VOICES, v)
    # эталон тембра для проверки — тестовая сцена из кастинга
    el.dump(qa.REF, {r: {'f0': c.get('f0'), 'centroid': c.get('centroid')} for r, c in v.items()})
    missing = sorted({l.who for l in LINES if not l.reuse} - set(v))
    if missing:
        sys.exit(f'в voices.json нет голосов: {", ".join(missing)}')
    return v


def paths(line_id, variant=None):
    d = os.path.join(RAW, f'ep{line_id[1]}')
    stem = line_id if variant is None else f'{line_id}.v{variant}'
    return os.path.join(d, stem + '.wav'), os.path.join(d, stem + '.json')


def save(line_id, audio, meta, variant=None):
    """audio — PCM из API (bytes) или уже готовый float-сигнал на частоте el.SR."""
    wav, js = paths(line_id, variant)
    os.makedirs(os.path.dirname(wav), exist_ok=True)
    sf.write(wav, el.pcm_to_float(audio) if isinstance(audio, bytes) else audio, el.SR, subtype='PCM_16')
    el.dump(js, meta)
    return wav


def seed_for(line_id, attempt):
    return (zlib.crc32(line_id.encode()) + 1009 * attempt) % 2 ** 31


def score(res):
    return 10 * len(critical(res)) + len(res['flags'])


def critical(res):
    return [f for f in res['flags'] if f.startswith(RETRY_ON)]


def gen_line(line: Line, voices, model, stitch, chain, stt):
    """Генерация с автопроверкой; возвращает request_id выбранного варианта."""
    v = voices[line.who]
    prev_text, next_text = neighbours(line)
    short = len(plain(line.text)) < 40
    kw = {}
    if line.chain and stitch:
        kw['previous_request_ids'] = chain[-3:]
    elif short or not line.chain:
        kw['previous_text'], kw['next_text'] = prev_text, next_text
    variants = max(1, line.variants)
    best = None
    attempt = 0
    tried = []
    while attempt < ATTEMPTS * variants:
        if tried and budget_left() < len(line.text) * 3:  # повтор не должен съесть символы следующих реплик
            break
        s = seed_for(line.id, attempt)
        pcm, al, rid = el.tts(v['voice_id'], line.text, model, v['settings'], seed=s, **kw)
        meta = {'id': line.id, 'model': model, 'voice_id': v['voice_id'], 'seed': s, 'request_id': rid, 'alignment': al}
        wav = save(line.id, pcm, meta, len(tried) + 1 if variants > 1 else f'{attempt}.vtmp')  # у каждой попытки свой файл
        res = qa.check(line, wav, stt=stt)
        meta['qa'] = res
        el.dump(wav[:-4] + '.json', meta)
        tried.append((score(res), wav, meta))
        attempt += 1
        if variants > 1 and len(tried) >= variants:
            break
        if variants == 1 and not critical(res):
            break
    tried.sort(key=lambda t: t[0])
    _, wav, meta = tried[0]
    meta['attempts'] = attempt
    meta['listen'] = bool(meta['qa']['flags'])
    dst_wav, dst_js = paths(line.id)
    shutil.copyfile(wav, dst_wav)
    el.dump(dst_js, meta)
    for _, w, _ in tried:  # временные файлы одиночных реплик убрать, варианты — оставить для выбора на слух
        if w.endswith('.vtmp.wav'):
            os.remove(w)
            os.remove(w[:-4] + '.json')
    return meta.get('request_id'), attempt, meta['qa']['flags']


def gen_dialogue(group, voices, model, stt):
    """E4-05 + E4-06: одна генерация Text to Dialogue, затем разрезать по говорящим."""
    lines = [l for l in LINES if l.dialogue == group]
    inputs = [{'text': l.text, 'voice_id': voices[l.who]['voice_id']} for l in lines]
    pcm, segments = el.dialogue(inputs, model, seed=seed_for(group, 0))
    if not segments:
        return False
    x = el.pcm_to_float(pcm)
    for i, l in enumerate(lines):
        segs = [s for s in segments if s.get('dialogue_input_index', -1) == i]
        if not segs:
            return False
        a = min(s['start_time_seconds'] for s in segs)
        b = max(s['end_time_seconds'] for s in segs)
        part = x[int(a * el.SR):int(b * el.SR)]
        meta = {'id': l.id, 'model': model, 'voice_id': voices[l.who]['voice_id'], 'dialogue': group, 'alignment': None}
        wav = save(l.id, part, meta)
        meta['qa'] = qa.check(l, wav, stt=stt)
        meta['listen'] = True  # разрезанный диалог всегда слушать
        el.dump(wav[:-4] + '.json', meta)
    return True


def main():
    args = sys.argv[1:]
    if '--choose' in args:
        i = args.index('--choose')
        lid, k = args[i + 1], int(args[i + 2])
        src_wav, src_js = paths(lid, k)
        dst_wav, dst_js = paths(lid)
        shutil.copyfile(src_wav, dst_wav)
        shutil.copyfile(src_js, dst_js)
        print(f'{lid}: выбран вариант {k}')
        return
    redo = set(args[args.index('--redo') + 1:]) if '--redo' in args else set()
    eps = [int(args[args.index('--ep') + 1])] if '--ep' in args else [1, 2, 3, 4, 5]
    voices = load_voices()
    model = el.pick_model()
    stitch = model == 'eleven_v4'
    stt = qa.scribe()
    print(f'модель: {model}; склейка запросов: {"да" if stitch else "нет"}; STT: {"да" if stt else "нет"}')
    log = {}
    if os.path.exists(LOG):
        with open(LOG, encoding='utf-8') as f:
            log = json.load(f)
    for ep in eps:
        ep_lines = [l for l in LINES if l.ep == ep and not l.reuse]
        todo = lambda l: l.id in redo or (not redo and not os.path.exists(paths(l.id)[0]))
        chain = []
        # 1. монолог цепочкой (уже готовые реплики тоже дают request_id для склейки)
        for l in [l for l in ep_lines if l.chain]:
            if todo(l):
                rid, n, flags = gen_line(l, voices, model, stitch, chain, stt)
                log[l.id] = {'attempts': n, 'flags': flags}
                print(f'{l.id}: попыток {n}{" · СЛУШАТЬ: " + "; ".join(flags) if flags else ""}', flush=True)
            else:
                with open(paths(l.id)[1], encoding='utf-8') as f:
                    rid = json.load(f).get('request_id')
            if rid:
                chain.append(rid)
        # 2. остальные реплики, 3. диалоги
        done_groups = set()
        for l in [l for l in ep_lines if not l.chain]:
            if not todo(l):
                continue
            if l.dialogue:
                if l.dialogue in done_groups:
                    continue
                done_groups.add(l.dialogue)
                if gen_dialogue(l.dialogue, voices, model, stt):
                    print(f'{l.dialogue}: диалог, разрезан — слушать', flush=True)
                    continue
                print(f'{l.dialogue}: нет сегментов говорящих — генерирую реплики по отдельности', flush=True)
                for d in [x for x in ep_lines if x.dialogue == l.dialogue]:
                    _, n, flags = gen_line(d, voices, model, stitch, chain, stt)
                    log[d.id] = {'attempts': n, 'flags': flags}
                continue
            _, n, flags = gen_line(l, voices, model, stitch, chain, stt)
            log[l.id] = {'attempts': n, 'flags': flags}
            print(f'{l.id}: попыток {n}{" · СЛУШАТЬ: " + "; ".join(flags) if flags else ""}', flush=True)
        el.dump(LOG, log)
    many = [k for k, v in log.items() if v['attempts'] > 3]
    print('перегенерировались больше 3 раз:', ' '.join(many) or 'нет')
    used, limit = el.usage()
    print(f'символов израсходовано: {used} из {limit}')
    print('дальше: python3 voice/process.py && python3 voice/qa.py')


if __name__ == '__main__':
    main()
