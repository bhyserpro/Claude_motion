import React from 'react';
import {Audio, Sequence, staticFile} from 'remotion';

type Vol = number | ((f: number) => number);

/**
 * Звук в окне [from, from+dur). Громкость — число или функция кадра (относительно начала звука),
 * плюс автоматические fadeIn/fadeOut в кадрах.
 */
export const Snd: React.FC<{
  src: string;
  from?: number;
  dur: number;
  vol?: Vol;
  loop?: boolean;
  trim?: number;
  fadeIn?: number;
  fadeOut?: number;
  rate?: number;
  name?: string;
}> = ({src, from = 0, dur, vol = 1, loop = false, trim = 0, fadeIn = 0, fadeOut = 0, rate, name}) => {
  if (dur <= 0) return null;
  // у зацикленного звука сдвиг начала должен быть меньше длины файла (самый короткий цикл ~7.7 с)
  const tr = loop ? trim % 180 : trim;
  const volume = (f: number) => {
    const base = typeof vol === 'function' ? vol(f) : vol;
    const a = fadeIn > 0 ? Math.min(1, f / fadeIn) : 1;
    const b = fadeOut > 0 ? Math.min(1, (dur - f) / fadeOut) : 1;
    return Math.max(0, base * a * b);
  };
  return (
    <Sequence from={from} durationInFrames={dur} name={name ?? src} layout="none">
      <Audio src={staticFile(`audio/${src}`)} volume={volume} loop={loop} trimBefore={tr || undefined} playbackRate={rate} />
    </Sequence>
  );
};

const GEIGER: [number, string][] = [
  [0.5, 'geiger_0_5.wav'],
  [2, 'geiger_2.wav'],
  [8, 'geiger_8.wav'],
  [40, 'geiger_40.wav'],
  [200, 'geiger_200.wav'],
];

export const geigerFile = (rate: number) => {
  let best = GEIGER[0];
  for (const g of GEIGER) if (Math.abs(Math.log(g[0] / rate)) < Math.abs(Math.log(best[0] / rate))) best = g;
  return best[1];
};

/**
 * Дозиметр: последовательность участков с разной частотой щелчков (кроссфейд 8 кадров).
 * segs: [кадр начала, частота/с]; конец последнего — end.
 */
export const GeigerTrack: React.FC<{segs: [number, number][]; end: number; vol?: number; xfade?: number}> = ({segs, end, vol = 0.8, xfade = 8}) => (
  <>
    {segs.map(([from, rate], i) => {
      const to = i + 1 < segs.length ? segs[i + 1][0] : end;
      if (rate <= 0) return null;
      const a = Math.max(0, from - (i > 0 ? xfade : 0));
      return (
        <Snd
          key={i}
          src={geigerFile(rate)}
          from={a}
          dur={to - a + (i + 1 < segs.length ? xfade : 0)}
          vol={vol}
          loop
          trim={(i * 97) % 300}
          fadeIn={i > 0 ? xfade : 2}
          fadeOut={i + 1 < segs.length ? xfade : 4}
        />
      );
    })}
  </>
);

import TIMES from '../../audio/geigerTimes.json';

const hitIn = (arr: number[], a: number, b: number) => {
  // есть ли щелчок в [a, b)
  let lo = 0;
  let hi = arr.length;
  while (lo < hi) {
    const m = (lo + hi) >> 1;
    if (arr[m] < a) lo = m + 1;
    else hi = m;
  }
  return lo < arr.length && arr[lo] < b;
};

/** Горит ли индикатор щелчка в кадре — синхронно с GeigerTrack с теми же segs. */
export const geigerLed = (frame: number, segs: [number, number][], end: number, xfade = 8, hold = 2) => {
  if (frame >= end) return false;
  let idx = -1;
  for (let i = 0; i < segs.length; i++) if (frame >= segs[i][0]) idx = i;
  if (idx < 0 || segs[idx][1] <= 0) return false;
  const [from, rate] = segs[idx];
  const file = geigerFile(rate);
  const arr = (TIMES as Record<string, number[]>)[file] ?? [];
  const a = Math.max(0, from - (idx > 0 ? xfade : 0));
  const trim = (idx * 97) % 300;
  const t1 = (((frame - a + trim) / 30) % 20 + 20) % 20;
  const t0 = t1 - hold / 30;
  return t0 >= 0 ? hitIn(arr, t0, t1 + 1 / 30) : hitIn(arr, 0, t1 + 1 / 30) || hitIn(arr, 20 + t0, 20);
};
