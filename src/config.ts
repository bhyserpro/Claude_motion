// Глобальные параметры проекта. Переключение на вертикаль: WIDTH = 1080, HEIGHT = 1920.
export const WIDTH = 1920;
export const HEIGHT = 1080;
export const FPS = 30;

// Базовая длительность серии: 3:00 (серии, подогнанные под озвучку, длиннее — см. episodes/durations.ts).
export const EP_SECONDS = 180;
export const EP_FRAMES = EP_SECONDS * FPS; // 5400
export const EPISODES = 5;

// Все сцены рисуются в «дизайн-пространстве» 1920×1080 и вписываются в кадр по ширине.
export const DW = 1920;
export const DH = 1080;
export const DESIGN_SCALE = WIDTH / DW;

// Киношный летербокс 2.39:1 поверх видимого изображения.
export const LETTERBOX_RATIO = 2.39;
export const IMAGE_H = Math.round(WIDTH / LETTERBOX_RATIO);
export const BAR_H = Math.max(0, Math.round((HEIGHT - IMAGE_H) / 2));
// Верх/низ «окна» изображения в координатах кадра.
export const IMAGE_TOP = BAR_H;
export const IMAGE_BOTTOM = HEIGHT - BAR_H;

// Масштаб текста: 1 при 1080p-ландшафте.
export const UI = Math.min(WIDTH, HEIGHT) / 1080;

export {PALETTE} from './theme/palette';
