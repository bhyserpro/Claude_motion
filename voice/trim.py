#!/usr/bin/env python3
"""
Сокращение пауз (патч №1, §2) — без генерации. Оригиналы в voice/raw не трогаются.

  python3 voice/trim.py            # все реплики → voice/trimmed/epN/<ID>.wav + .json (тайминг символов пересчитан)
  python3 voice/trim.py E2-06      # только эти

Пауза — участок тише −45 дБ от пика реплики длиннее 0,6 с. Она укорачивается до 0,5 с вырезом из середины
с кроссфейдом 20 мс; вдохи и выдохи громче порога, поэтому не попадают в вырез. Смысловые паузы (MEANINGFUL) —
до 0,9 с, E2-06 «…и с этой стороны» — 0,8 с. Тишина по краям — 40 мс.
"""
import json
import os
import sys

import numpy as np
import soundfile as sf

sys.path.insert(0, os.path.dirname(__file__))
from lines import LINES  # noqa: E402

ROOT = os.path.join(os.path.dirname(__file__), '..')
RAW = os.path.join(ROOT, 'voice', 'raw')
OUT = os.path.join(ROOT, 'voice', 'trimmed')
SR = 44100
THRESH_DB = -45.0
MIN_PAUSE = 0.6  # §1: внутри реплики не больше 0,6 с (§2 называет 0,7 — берём строже)
TARGET = 0.5
EDGE = 0.04
XF = 0.02
# смысловые паузы: «Если вздохнёшь… умрёшь», «Кроме тебя», «Причина убытка… Ущерб: полный»;
# E3-08 и E4-09 — задержанное дыхание без слов, пауза и есть содержание реплики
MEANINGFUL = {'E3-01': 0.9, 'E4-08': 0.9, 'E5-06': 0.9, 'E3-08': 0.9, 'E4-09': 0.9, 'E2-06': None}
E2_06_SCRAPE_PAUSE = 0.8  # «Царапины на герме… и с этой стороны» — под скрежет за гермой
# лишнее в начале генерации, которое нельзя перегенерировать (кредиты): E3-10 начинается с «Тсс» из соседней реплики
HEAD_CUT = {'E3-10': 0.8}


def envelope_db(x, win=0.02):
    k = int(win * SR)
    p = np.convolve(x ** 2, np.ones(k) / k, mode='same')
    return 10 * np.log10(p + 1e-12)


def pauses(x):
    """Внутренние паузы [(начало, конец)] в отсчётах и края звучания."""
    env = envelope_db(x)
    peak = env.max()
    loud = env > peak + THRESH_DB
    idx = np.where(loud)[0]
    if not len(idx):
        return [], 0, len(x)
    a, b = idx[0], idx[-1]
    out = []
    i = a
    while i < b:
        if not loud[i]:
            j = i
            while j < b and not loud[j]:
                j += 1
            if (j - i) / SR > MIN_PAUSE:
                out.append((i, j))
            i = j
        else:
            i += 1
    return out, a, b


def word_after(al, t):
    """Первое произнесённое слово после момента t (для E2-06)."""
    chars, starts = al['characters'], al['character_start_times_seconds']
    text = ''.join(chars).lower()
    for w in ('и с этой', 'с этой стороны'):
        i = text.find(w)
        if i >= 0 and abs(starts[i] - t) < 2.5:
            return True
    return False


def trim_line(line_id):
    ep = line_id[1]
    src = os.path.join(RAW, f'ep{ep}', f'{line_id}.wav')
    x, sr = sf.read(src, dtype='float64', always_2d=False)
    assert sr == SR
    meta = json.load(open(src[:-4] + '.json', encoding='utf-8'))
    al = meta.get('alignment')
    ps, a, b = pauses(x)
    head = int(HEAD_CUT.get(line_id, 0) * SR)
    if head:
        ps = [p for p in ps if p[0] > head]
        a = max(a, head + int(EDGE * SR))
    cap = MEANINGFUL.get(line_id, TARGET)
    # куски, которые остаются: [(с, по)] в исходных отсчётах
    keep = []
    cur = max(0, a - int(EDGE * SR))
    log = []
    for p0, p1 in ps:
        dur = (p1 - p0) / SR
        tgt = TARGET if cap is None else cap
        if line_id == 'E2-06' and al and word_after(al, p1 / SR):
            tgt = E2_06_SCRAPE_PAUSE
        if dur <= tgt:
            continue
        cut = int((dur - tgt) * SR)
        mid = (p0 + p1) // 2
        c0, c1 = mid - cut // 2, mid - cut // 2 + cut
        keep.append((cur, c0))
        cur = c1
        log.append((round(p0 / SR, 2), round(dur, 2), round(tgt, 2)))
    keep.append((cur, min(len(x), b + int(EDGE * SR))))
    # склейка с кроссфейдом
    xf = int(XF * SR)
    y = x[keep[0][0]:keep[0][1]].copy()
    for s0, s1 in keep[1:]:
        seg = x[max(0, s0 - xf):s1].copy()
        n = min(xf, len(y), s0 - max(0, s0 - xf))
        if n > 0:
            ramp = np.linspace(0, 1, n)
            y[-n:] = y[-n:] * (1 - ramp) + seg[:n] * ramp
            y = np.concatenate([y, seg[n:]])
        else:
            y = np.concatenate([y, seg])

    # отображение времени исходное → новое; кроссфейд перекрывает по xf отсчётов на каждой склейке
    def remap_xf(t):
        s = t * SR
        acc = 0
        for i, (s0, s1) in enumerate(keep):
            if s < s0:
                return max(0.0, acc / SR)
            if s <= s1:
                return max(0.0, (acc + s - s0) / SR)
            acc += s1 - s0 - (xf if i + 1 < len(keep) else 0)
        return acc / SR
    if al:
        al = dict(al)
        for key in ('character_start_times_seconds', 'character_end_times_seconds'):
            al[key] = [round(remap_xf(t), 4) for t in meta['alignment'][key]]
    os.makedirs(os.path.join(OUT, f'ep{ep}'), exist_ok=True)
    dst = os.path.join(OUT, f'ep{ep}', f'{line_id}.wav')
    sf.write(dst, y.astype(np.float32), SR, subtype='PCM_16')
    with open(dst[:-4] + '.json', 'w', encoding='utf-8') as f:
        json.dump({**meta, 'alignment': al, 'trimmed': {'pauses': log, 'from_dur': round(len(x) / SR, 2),
                                                       'to_dur': round(len(y) / SR, 2)}}, f, ensure_ascii=False, indent=1)
    return len(x) / SR, len(y) / SR, log


def main():
    ids = set(sys.argv[1:])
    rows = []
    for l in LINES:
        if l.reuse or (ids and l.id not in ids):
            continue
        if not os.path.exists(os.path.join(RAW, f'ep{l.id[1]}', f'{l.id}.wav')):
            continue
        d0, d1, log = trim_line(l.id)
        rows.append((l.id, d0, d1, log))
    with open(os.path.join(OUT, 'report.json'), 'w', encoding='utf-8') as f:
        json.dump({r[0]: {'from': round(r[1], 2), 'to': round(r[2], 2), 'pauses': r[3]} for r in rows}, f, ensure_ascii=False, indent=1)
    for lid, d0, d1, log in rows:
        if log or d0 - d1 > 0.15:
            print(f'{lid}: {d0:5.2f} → {d1:5.2f} с' + ''.join(f'  [{p[0]} с: {p[1]}→{p[2]}]' for p in log))
    print(f'реплик: {len(rows)}, сокращено всего {sum(r[1] - r[2] for r in rows):.1f} с')


if __name__ == '__main__':
    main()
