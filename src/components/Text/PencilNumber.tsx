import React from 'react';
import {interpolate, random, useCurrentFrame} from 'remotion';
import {FONT_HAND} from '../../lib/fonts';
import {noise1} from '../../lib/noise';

/**
 * Рукописная пометка героя (карандаш) поверх кадра. Координаты — дизайн-пространство.
 * Появляется «прописыванием» слева направо; tremble — дрожание (для «15»).
 */
export const PencilNumber: React.FC<{
  x: number;
  y: number;
  text: string;
  at: number;
  until?: number;
  size?: number;
  color?: string;
  tremble?: number;
  rotate?: number;
  writeFrames?: number;
}> = ({x, y, text, at, until, size = 64, color = '#C9C3B4', tremble = 0, rotate, writeFrames = 7}) => {
  const frame = useCurrentFrame();
  if (frame < at || (until !== undefined && frame >= until)) return null;
  const p = interpolate(frame, [at, at + writeFrames], [0, 100], {extrapolateRight: 'clamp'});
  const fade = until !== undefined ? interpolate(frame, [until - 8, until], [1, 0], {extrapolateLeft: 'clamp'}) : 1;
  const rot = rotate ?? (random(`pn-${text}-${x}`) - 0.5) * 10;
  const jx = tremble ? noise1(`tr-${text}x`, frame / 1.3) * tremble : 0;
  const jy = tremble ? noise1(`tr-${text}y`, frame / 1.1) * tremble : 0;
  return (
    <div
      style={{
        position: 'absolute',
        left: x + jx,
        top: y + jy,
        transform: `translate(-50%, -50%) rotate(${rot + (tremble ? noise1('trr', frame / 2) * tremble * 0.6 : 0)}deg)`,
        fontFamily: FONT_HAND,
        fontWeight: 600,
        fontSize: size,
        lineHeight: 1,
        color,
        opacity: 0.88 * fade,
        clipPath: `inset(-20% ${100 - p}% -20% -10%)`,
        textShadow: '0 0 1px rgba(0,0,0,0.6)',
        whiteSpace: 'nowrap',
        pointerEvents: 'none',
      }}
    >
      {text}
    </div>
  );
};
