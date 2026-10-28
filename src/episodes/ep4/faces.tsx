import React from 'react';
import {Blind} from '../../components/Characters/Blind';
import {CoatFigure} from '../../components/Characters/CoatFigure';
import {LongHand} from '../../components/Characters/parts';
import {LIGHT_FN} from '../../components/Characters/Rig';
import {carWindows, Rect} from '../../components/Props/MetroCar';

/** Лицо за стеклом: голова по центру окна. appear 0..1 — проступает из тьмы. */
export const WindowFace: React.FC<{w: Rect; seed: string; appear: number; yaw?: number; dx?: number; scale?: number; coat?: boolean; frame: number}> = ({
  w,
  seed,
  appear,
  yaw = 0,
  dx = 0,
  scale = 0.62,
  coat = false,
  frame,
}) => {
  if (appear <= 0.01) return null;
  const hu = ((175 / 180) * 1000) / 6;
  const cx = w.x + w.w / 2 + dx;
  const cy = w.y + w.h * 0.46;
  const feet = cy + 5.42 * hu * scale;
  const fog = 1 - appear * 0.82;
  if (coat) {
    return <CoatFigure x={cx} y={feet + 40} scale={scale * 0.92} view="front" headUp light="emergency" lod={2} fog={fog} fogColor="#050101" puddle={false} frame={frame} />;
  }
  return <Blind x={cx} y={feet} scale={scale} seed={seed} kind="B" view="front" headYaw={yaw} light="emergency" lod={2} fog={fog} fogColor="#050101" ash={0.6} frame={frame} pose={{armL: [4, 4], armR: [4, 4]}} />;
};

/** Ладонь, прижатая к стеклу снаружи (рисуется в слое стены поверх стекла). */
export const PalmOnGlass: React.FC<{w: Rect; press: number; side?: number; seed: string}> = ({w, press, side = 1, seed}) => {
  if (press <= 0.01) return null;
  const x = w.x + w.w * (side > 0 ? 0.78 : 0.22);
  const y = w.y + w.h * (1.05 - press * 0.25);
  return (
    <g opacity={Math.min(1, press * 1.5)} transform={`translate(${x},${y}) rotate(180) scale(${side},1)`}>
      <LongHand c={(c) => LIGHT_FN.emergency(c)} len={150} skin="#E3DDD2" shade="#a69e92" nails="#2a201e" pose="open" strips seed={seed} />
    </g>
  );
};

export const WIN = carWindows();
