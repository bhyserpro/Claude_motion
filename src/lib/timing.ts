import {FPS} from '../config';

/** Секунды → кадры. */
export const sec = (n: number) => Math.round(n * FPS);

/** «М:СС» или «М:СС.д» → кадры. */
export const tc = (s: string) => {
  const [m, rest] = s.split(':');
  return Math.round((Number(m) * 60 + Number(rest)) * FPS);
};

export type SceneDef = {id: string; from: number; dur: number};

/** Сцены по таймкодам «от — до» → массив {from, dur}, без зазоров. */
export const scenesFromTimecodes = (list: [string, string, string][]): SceneDef[] =>
  list.map(([id, a, b]) => ({id, from: tc(a), dur: tc(b) - tc(a)}));

export const sceneMap = (list: SceneDef[]) => {
  const out: Record<string, SceneDef> = {};
  for (const s of list) out[s.id] = s;
  return out;
};

/** Длительность серии — сумма её сцен. */
export const totalFrames = (list: SceneDef[]) => list.reduce((t, s) => t + s.dur, 0);

/** Проверка: сцены идут без дыр и вместе дают total кадров. */
export const assertTiling = (list: SceneDef[], total: number, name: string) => {
  let t = 0;
  for (const s of list) {
    if (s.from !== t) throw new Error(`${name}: сцена ${s.id} начинается с ${s.from}, ожидалось ${t}`);
    t += s.dur;
  }
  if (t !== total) throw new Error(`${name}: сумма сцен ${t} ≠ ${total}`);
};

/** Окно [a, b) в кадрах. */
export const inRange = (f: number, a: number, b: number) => f >= a && f < b;
