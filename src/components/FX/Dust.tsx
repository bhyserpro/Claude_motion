import React from 'react';
import {random, useCurrentFrame} from 'remotion';
import {noise1} from '../../lib/noise';

/**
 * Пыль / пепел. Частицы детерминированы по seed. Рисуется внутри <svg>.
 * fall — скорость падения (px/кадр), drift — боковой снос.
 */
export const Dust: React.FC<{
  seed: string;
  count: number;
  x: number;
  y: number;
  w: number;
  h: number;
  color?: string;
  size?: [number, number];
  fall?: number;
  drift?: number;
  opacity?: number;
  flakes?: boolean;
  frameOffset?: number;
  clipPath?: string;
}> = ({
  seed,
  count,
  x,
  y,
  w,
  h,
  color = '#8D8F8A',
  size = [1, 3],
  fall = 0.6,
  drift = 0.4,
  opacity = 0.7,
  flakes = false,
  frameOffset = 0,
  clipPath,
}) => {
  const frame = useCurrentFrame() + frameOffset;
  const items: React.ReactNode[] = [];
  for (let i = 0; i < count; i++) {
    const r0 = random(`${seed}-x${i}`);
    const r1 = random(`${seed}-y${i}`);
    const r2 = random(`${seed}-s${i}`);
    const sp = 0.5 + random(`${seed}-v${i}`);
    const px = x + ((r0 * w + noise1(`${seed}-n${i}`, frame / 60) * 40 * drift + frame * drift * 0.2 * (r2 - 0.5)) % w + w) % w;
    const py = y + ((r1 * h + frame * fall * sp) % h + h) % h;
    const s = size[0] + r2 * (size[1] - size[0]);
    const a = opacity * (0.35 + 0.65 * Math.abs(noise1(`${seed}-a${i}`, frame / 25)));
    if (flakes) {
      const rot = (frame * 2 * (r0 - 0.5) + r1 * 360) % 360;
      items.push(
        <rect key={i} x={px - s} y={py - s * 0.6} width={s * 2} height={s * 1.2} fill={color} opacity={a} transform={`rotate(${rot} ${px} ${py})`} />,
      );
    } else {
      items.push(<circle key={i} cx={px} cy={py} r={s} fill={color} opacity={a} />);
    }
  }
  return <g clipPath={clipPath}>{items}</g>;
};
