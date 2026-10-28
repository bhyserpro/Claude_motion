import {Easing, interpolate} from 'remotion';
import {fbm1} from './noise';

/**
 * Виртуальная 2.5D-камера.
 * x, y — панорама (в пикселях на глубине z=1);
 * dolly — продвижение камеры вперёд по глубине (0 — исходная позиция);
 * zoom — оптический зум всего кадра; roll — крен в градусах;
 * shakeX/shakeY — дрожание в пикселях кадра.
 */
export type Camera = {
  x: number;
  y: number;
  dolly: number;
  zoom: number;
  roll: number;
  shakeX: number;
  shakeY: number;
};

export const CAM0: Camera = {x: 0, y: 0, dolly: 0, zoom: 1, roll: 0, shakeX: 0, shakeY: 0};

export type CamKey = {f: number} & Partial<Omit<Camera, 'shakeX' | 'shakeY'>>;

const EASE = Easing.inOut(Easing.cubic);

/** Интерполяция камеры по ключам (каждое свойство — отдельно, с ease in-out). */
export const camKeys = (frame: number, keys: CamKey[], ease = EASE): Camera => {
  const out: Camera = {...CAM0};
  const props: (keyof Omit<Camera, 'shakeX' | 'shakeY'>)[] = ['x', 'y', 'dolly', 'zoom', 'roll'];
  for (const p of props) {
    const ks = keys.filter((k) => k[p] !== undefined);
    if (ks.length === 0) continue;
    if (ks.length === 1) {
      out[p] = ks[0][p] as number;
      continue;
    }
    out[p] = interpolate(
      frame,
      ks.map((k) => k.f),
      ks.map((k) => k[p] as number),
      {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: ease},
    );
  }
  return out;
};

/** «Ручное» покачивание: амплитуда 2–4 px, медленный шум. */
export const handheld = (cam: Camera, frame: number, amp = 3, seed = 'hand'): Camera => ({
  ...cam,
  shakeX: cam.shakeX + fbm1(`${seed}x`, frame / 45, 2) * amp,
  shakeY: cam.shakeY + fbm1(`${seed}y`, frame / 52, 2) * amp * 0.8,
  roll: cam.roll + fbm1(`${seed}r`, frame / 70, 2) * amp * 0.04,
});

/** Удар: быстро затухающая тряска с начала start. */
export const impact = (cam: Camera, frame: number, start: number, amp = 30, dur = 24, seed = 'imp'): Camera => {
  const t = frame - start;
  if (t < 0 || t > dur) return cam;
  const k = Math.pow(1 - t / dur, 2) * amp;
  return {
    ...cam,
    shakeX: cam.shakeX + fbm1(`${seed}x`, t / 1.6, 1) * k,
    shakeY: cam.shakeY + fbm1(`${seed}y`, t / 1.4, 1) * k,
    roll: cam.roll + fbm1(`${seed}r`, t / 2, 1) * k * 0.05,
  };
};

/** Непрерывная тряска (гудок, вибрация). */
export const rumble = (cam: Camera, frame: number, amp: number, seed = 'rum'): Camera =>
  amp <= 0
    ? cam
    : {
        ...cam,
        shakeX: cam.shakeX + fbm1(`${seed}x`, frame / 1.7, 1) * amp,
        shakeY: cam.shakeY + fbm1(`${seed}y`, frame / 1.5, 1) * amp,
      };

/** Параметры CSS-трансформа слоя на глубине z (параллакс ∝ 1/z, наезд — dolly). */
export const layerTransform = (cam: Camera, z: number) => {
  const d = Math.min(cam.dolly, z - 0.05);
  const depth = z - d;
  const s = z / depth;
  return {s, tx: -cam.x / depth, ty: -cam.y / depth};
};
