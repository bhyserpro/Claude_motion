import {random} from 'remotion';

// Детерминированный шум на базе random(seed) из remotion.

const smooth = (t: number) => t * t * (3 - 2 * t);

/** Гладкий 1D value-noise в диапазоне [-1, 1]. */
export const noise1 = (seed: string | number, t: number) => {
  const i = Math.floor(t);
  const f = t - i;
  const a = random(`${seed}:${i}`) * 2 - 1;
  const b = random(`${seed}:${i + 1}`) * 2 - 1;
  return a + (b - a) * smooth(f);
};

/** Фрактальный шум из нескольких октав, [-1, 1] примерно. */
export const fbm1 = (seed: string | number, t: number, octaves = 3) => {
  let amp = 1;
  let freq = 1;
  let sum = 0;
  let norm = 0;
  for (let o = 0; o < octaves; o++) {
    sum += noise1(`${seed}/${o}`, t * freq) * amp;
    norm += amp;
    amp *= 0.5;
    freq *= 2.1;
  }
  return sum / norm;
};

/** Случайное число в [a, b) по seed. */
export const rnd = (seed: string | number, a = 0, b = 1) => a + random(String(seed)) * (b - a);

/** Целое в [a, b]. */
export const rndInt = (seed: string | number, a: number, b: number) =>
  Math.floor(rnd(seed, a, b + 1 - 1e-9));

/** Выбор элемента массива по seed. */
export const pick = <T,>(seed: string | number, arr: readonly T[]): T => arr[rndInt(seed, 0, arr.length - 1)];

/** Пуассоновские события: true, если в кадре f есть щелчок при частоте rate/с. */
export const poissonHit = (seed: string, f: number, ratePerSec: number, fps = 30) =>
  random(`${seed}:${f}`) < 1 - Math.exp(-ratePerSec / fps);
