import {VoiceLine, wordFrameIn} from '../../components/Voice';
import voice from './voice.json';
import {EP2} from './timing';

/**
 * Акт осмотра № 1 идёт за диктовкой E2-06: бланк на экране с «Пункт N» и первых слов пункта,
 * потом — вставка-доказательство до следующего «Пункт». Кадры — от начала сцены act.
 */
const lines = voice as VoiceLine[];
const base = EP2.act.from;
const at = (word: string, fallback: number, nth = 0) => wordFrameIn(lines, 'E2-06', word, base + fallback, nth) - base;

export const PAPER_HOLD = 40; // сколько бланк держится после «Пункт N»
export const ACT1_POINTS = [0, 1, 2, 3, 4].map((i) => at('Пункт', 80 + i * 210, i));
export const ACT1_START = at('Акт', 10);
export const ACT1_SCRAPE: [number, number] = [at('герме', 330), at('и', 370)]; // пауза «Царапины на герме… и с этой стороны»
const e206 = lines.find((l) => l.id === 'E2-06');
export const ACT1_END = e206 ? e206.startFrame + e206.durationFrames - base : 880;

/** Участки, где на экране бланк (летербокс там не рисуется) — от начала сцены. */
export const ACT1_PAPER: [number, number][] = [
  [0, ACT1_POINTS[0] + PAPER_HOLD],
  ...ACT1_POINTS.slice(1).map((p) => [p - 2, p + PAPER_HOLD] as [number, number]),
];
