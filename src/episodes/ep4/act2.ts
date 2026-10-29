import {VoiceLine, wordFrameIn} from '../../components/Voice';
import voice from './voice.json';
import {EP4} from './timing';

/** Акт осмотра № 2 идёт за речью Глеба (E4-03): кадры вставок — от начала сцены act. */
const lines = voice as VoiceLine[];
const base = EP4.act.from;
const w = (word: string, fallback: number, nth = 0) => wordFrameIn(lines, 'E4-03', word, base + fallback, nth) - base;
const e403 = lines.find((l) => l.id === 'E4-03');

export const A2 = {
  paperA: w('Прокол', 60) - 4,
  elbow: w('Семёна', 90),
  ampoules: w('Пустые', 130) - 2,
  notebook: w('Список', 230) - 2,
  paperB: w('Галочка', 260) - 2,
  room: w('Мы', 370) - 2,
  round: w('Когда', 490) - 2,
  paperC: w('Нельзя', 620) - 2,
  end: (e403 ? e403.startFrame + e403.durationFrames - base : 790) + 6,
};

/** Бланк на экране (летербокс там не рисуется) — от начала сцены act. */
export const ACT2_PAPER: [number, number][] = [
  [A2.paperA, A2.elbow],
  [A2.paperB, A2.room],
  [A2.paperC, A2.end],
];
