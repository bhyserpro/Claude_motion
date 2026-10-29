import React, {createContext, useContext} from 'react';
import {Audio, Internals, Sequence, staticFile, useCurrentFrame} from 'remotion';
import {FPS} from '../config';

/**
 * Озвучка серии. Данные — src/episodes/epN/voice.json, его пишет voice/process.py
 * (кадры — от начала серии, chars — тайминг каждого произнесённого символа из /with-timestamps).
 * Пока голоса не сгенерированы, массив пустой и всё ниже ничего не делает.
 */
export type VoiceChar = {c: string; t: number};
export type VoiceLine = {
  id: string;
  character: string;
  file: string;
  startFrame: number;
  durationFrames: number;
  volume?: number;
  duck?: boolean; // приглушать фон под репликой (по умолчанию да)
  chars: VoiceChar[];
};

type Ctx = {lines: VoiceLine[]; base: number};
const VoiceCtx = createContext<Ctx>({lines: [], base: 0});

/** Кадр от начала серии — и в отдельной серии, и внутри FullFilm. */
export const useEpisodeFrame = () => Internals.useTimelinePosition() - useContext(VoiceCtx).base;
export const useVoiceLine = (id?: string) => {
  const {lines} = useContext(VoiceCtx);
  return id ? lines.find((l) => l.id === id) : undefined;
};

export const VoiceProvider: React.FC<{lines: VoiceLine[]; children: React.ReactNode}> = ({lines, children}) => {
  const base = Internals.useTimelinePosition() - useCurrentFrame();
  return (
    <VoiceCtx.Provider value={{lines, base}}>
      {children}
      {lines.map((l) => (
        <Sequence key={l.id} from={l.startFrame} durationInFrames={l.durationFrames} name={`voice ${l.id}`} layout="none">
          <Audio src={staticFile(l.file)} volume={l.volume ?? 1} />
        </Sequence>
      ))}
    </VoiceCtx.Provider>
  );
};

const DUCK = 0.56; // −5 дБ
const ATTACK = Math.round(0.15 * FPS);
const RELEASE = Math.round(0.6 * FPS);

/** Множитель громкости фона в кадре серии f: плавно уходит на −5 дБ под голосом. */
export const duckAt = (lines: VoiceLine[], f: number) => {
  let env = 0;
  for (const l of lines) {
    if (l.duck === false) continue;
    const a = l.startFrame;
    const b = l.startFrame + l.durationFrames;
    if (f < a - ATTACK || f > b + RELEASE) continue;
    const e = f < a ? (f - (a - ATTACK)) / ATTACK : f <= b ? 1 : 1 - (f - b) / RELEASE;
    env = Math.max(env, e);
  }
  return 1 - (1 - DUCK) * env;
};

/** Смещение «кадр серии − локальный кадр» для звука фона: Snd по нему считает ducking. */
export const useDuck = () => {
  const {lines, base} = useContext(VoiceCtx);
  const off = Internals.useTimelinePosition() - base - useCurrentFrame();
  return lines.length ? (local: number) => duckAt(lines, off + local) : null;
};

const norm = (s: string) => s.toLowerCase().replace(/ё/g, 'е');
const isLetter = (c: string) => /[\p{L}\p{N}]/u.test(c);

type Word = {w: string; a: number; b: number};

/** Слова, которые реально произнесены: теги [..] выброшены, у каждого слова время начала и конца. */
const spokenWords = (chars: VoiceChar[]): Word[] => {
  const out: Word[] = [];
  let tag = false;
  let cur: Word | null = null;
  chars.forEach((ch, i) => {
    if (ch.c === '[') tag = true;
    const letter = !tag && isLetter(ch.c);
    if (letter) {
      const next = chars[i + 1]?.t ?? ch.t + 0.08;
      if (!cur) cur = {w: '', a: ch.t, b: next};
      cur.w += norm(ch.c);
      cur.b = next;
    } else if (cur) {
      out.push(cur);
      cur = null;
    }
    if (ch.c === ']') tag = false;
  });
  if (cur) out.push(cur);
  return out;
};

/**
 * Время (с от начала реплики) появления каждого символа показанного текста.
 * Показанный текст может отличаться от произнесённого (цифры, «—» вместо «...», часть реплики):
 * слова сопоставляются по порядку, несовпавшие получают время соседей.
 */
export const alignText = (lines: string[], chars: VoiceChar[]): number[][] => {
  const spoken = spokenWords(chars);
  const flat = lines.map((l) => l.replace(/\*\*/g, ''));
  type DW = {line: number; from: number; to: number; w: string; t?: [number, number]};
  const words: DW[] = [];
  flat.forEach((l, li) => {
    const re = /[\p{L}\p{N}]+/gu;
    let m: RegExpExecArray | null;
    while ((m = re.exec(l))) words.push({line: li, from: m.index, to: m.index + m[0].length, w: norm(m[0])});
  });
  // жадное сопоставление по порядку; начало — то вхождение первого слова, с которого совпадает больше всего
  const match = (j0: number, assign: boolean) => {
    let j = j0;
    let n = 0;
    for (const dw of words) {
      for (let k = j; k < Math.min(spoken.length, j + 6); k++) {
        if (spoken[k].w === dw.w) {
          if (assign) dw.t = [spoken[k].a, spoken[k].b];
          j = k + 1;
          n++;
          break;
        }
      }
    }
    return n;
  };
  let best = 0;
  let bestN = -1;
  spoken.forEach((s, k) => {
    if (words.length && s.w === words[0].w) {
      const n = match(k, false);
      if (n > bestN) [best, bestN] = [k, n];
    }
  });
  match(best, true);
  // несовпавшие слова — между соседями
  const end = spoken.length ? spoken[spoken.length - 1].b : 0;
  words.forEach((dw, i) => {
    if (dw.t) return;
    const prev = words.slice(0, i).reverse().find((x) => x.t)?.t?.[1] ?? 0;
    const next = words.slice(i + 1).find((x) => x.t)?.t?.[0] ?? end;
    dw.t = [prev, Math.max(prev, next)];
  });
  const times = flat.map((l) => new Array<number>(l.length).fill(-1));
  for (const dw of words) {
    const [a, b] = dw.t!;
    for (let c = dw.from; c < dw.to; c++) times[dw.line][c] = a + ((b - a) * (c - dw.from)) / (dw.to - dw.from);
  }
  // пробелы и знаки — вместе с предыдущим символом; время не убывает
  let last = words.length ? words[0].t![0] : 0;
  for (const row of times) {
    for (let c = 0; c < row.length; c++) {
      if (row[c] < 0) row[c] = last;
      last = Math.max(last, row[c]);
      row[c] = last;
    }
  }
  return times;
};
