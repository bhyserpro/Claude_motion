import {DH, DW} from '../config';
import {mix} from './color';

/**
 * Простая перспективная проекция для «глубоких» декораций (вагон вдоль, туннель, шахта).
 * Мир в метрах: x — вправо, y — вниз (0 — уровень глаз), z — в глубину.
 */
export type PCam = {x: number; y: number; z: number; f: number; cx?: number; cy?: number};

export const makeProjector = (cam: PCam) => {
  const cx = cam.cx ?? DW / 2;
  const cy = cam.cy ?? DH / 2;
  const near = 0.12;
  const P = (x: number, y: number, z: number): [number, number] => {
    const d = Math.max(near, z - cam.z);
    return [cx + (cam.f * (x - cam.x)) / d, cy + (cam.f * (y - cam.y)) / d];
  };
  /** px на метр на глубине z */
  const scaleAt = (z: number) => cam.f / Math.max(near, z - cam.z);
  const depth = (z: number) => z - cam.z;
  const poly = (pts: [number, number, number][]) => pts.map((p) => P(...p).map((v) => v.toFixed(1)).join(',')).join(' ');
  return {P, scaleAt, depth, poly, cam};
};

export type Projector = ReturnType<typeof makeProjector>;

/** Туман по глубине: доля смешивания с цветом тьмы. */
export const fogAt = (depth: number, start: number, end: number) =>
  Math.max(0, Math.min(1, (depth - start) / (end - start)));

export const fogColor = (c: string, depth: number, fog: string, start: number, end: number) =>
  mix(c, fog, fogAt(depth, start, end));

/** Масштаб риг-юнитов (1000 = 180 см) к пикселям на глубине z. */
export const rigScaleAt = (pr: Projector, z: number) => (pr.scaleAt(z) * 1.8) / 1000;
