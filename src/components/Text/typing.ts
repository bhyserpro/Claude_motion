import {FPS} from '../../config';

/** Сколько символов строки уже напечатано к кадру f. */
export const typedCount = (f: number, start: number, cps: number) => Math.max(0, Math.floor(((f - start) * cps) / FPS));

/** Разбивка нескольких строк на последовательный набор (каждая следующая печатается после предыдущей). */
export const typeLines = (lines: string[], f: number, start: number, cps: number, gap = 6) => {
  const out: string[] = [];
  let t = start;
  for (const line of lines) {
    const plain = line.replace(/\*\*/g, '');
    const n = Math.min(plain.length, typedCount(f, t, cps));
    out.push(plain.slice(0, n));
    t += Math.ceil((plain.length / cps) * FPS) + gap;
  }
  return {out, endFrame: t};
};

/** Длительность набора строк в кадрах. */
export const typeDuration = (lines: string[], cps: number, gap = 6) =>
  lines.reduce((t, l) => t + Math.ceil((l.replace(/\*\*/g, '').length / cps) * FPS) + gap, 0);
