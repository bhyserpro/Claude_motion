import {loadFont as loadPTSerif} from '@remotion/google-fonts/PTSerif';
import {loadFont as loadMono} from '@remotion/google-fonts/JetBrainsMono';
import {loadFont as loadCaveat} from '@remotion/google-fonts/Caveat';
import {continueRender, delayRender} from 'remotion';

// Только кириллица + латиница (для цифр и знаков). Ожидаем загрузку через delayRender.
const serif = loadPTSerif('normal', {weights: ['400', '700'], subsets: ['cyrillic', 'latin']});
const serifItalic = loadPTSerif('italic', {weights: ['400'], subsets: ['cyrillic', 'latin']});
const mono = loadMono('normal', {weights: ['400', '500'], subsets: ['cyrillic', 'latin']});
const hand = loadCaveat('normal', {weights: ['400', '600'], subsets: ['cyrillic', 'latin']});

const handle = delayRender('Загрузка шрифтов');
Promise.all([serif.waitUntilDone(), serifItalic.waitUntilDone(), mono.waitUntilDone(), hand.waitUntilDone()])
  .then(() => continueRender(handle))
  .catch((e) => {
    // Без шрифтов кадр будет неверным, но рендер не должен зависнуть навсегда.
    console.error('Шрифты не загрузились', e);
    continueRender(handle);
  });

export const FONT_SERIF = `${serif.fontFamily}, Georgia, serif`;
export const FONT_MONO = `${mono.fontFamily}, monospace`;
export const FONT_HAND = `${hand.fontFamily}, cursive`;
