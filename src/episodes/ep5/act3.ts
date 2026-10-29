import {VoiceLine, wordFrameIn} from '../../components/Voice';
import voice from './voice.json';
import {EP5} from './timing';

/** Акт осмотра № 3 идёт за диктовкой E5-06: кадры — от начала сцены act. */
const lines = voice as VoiceLine[];
const base = EP5.act.from;
const w = (word: string, fallback: number) => wordFrameIn(lines, 'E5-06', word, base + fallback) - base;
const e506 = lines.find((l) => l.id === 'E5-06');

export const A3 = {
  start: w('Акт', 36) - 4,
  object: w('Объект', 100),
  reason: w('Причина', 280),
  damage: w('Ущерб', 340),
  end: (e506 ? e506.startFrame + e506.durationFrames - base : 400) + 8,
};
export const ACT3_PAPER: [number, number] = [A3.start, A3.end];
