import React, {useMemo} from 'react';
import {random} from 'remotion';

type Seg = {d: string; w: number; delay: number};

/** Генерация радиальных трещин с ветвлением (детерминированно по seed). */
const buildCracks = (seed: string, cx: number, cy: number, radius: number, rays: number): Seg[] => {
  const segs: Seg[] = [];
  const walk = (x: number, y: number, ang: number, len: number, w: number, depth: number, delay: number, tag: string) => {
    let px = x;
    let py = y;
    let d = `M${px.toFixed(1)},${py.toFixed(1)}`;
    const steps = 5 + Math.floor(random(`${tag}-st`) * 5);
    for (let s = 0; s < steps; s++) {
      ang += (random(`${tag}-a${s}`) - 0.5) * 0.7;
      const l = (len / steps) * (0.6 + random(`${tag}-l${s}`) * 0.8);
      px += Math.cos(ang) * l;
      py += Math.sin(ang) * l;
      d += ` L${px.toFixed(1)},${py.toFixed(1)}`;
      if (depth < 2 && random(`${tag}-b${s}`) < 0.28) {
        walk(px, py, ang + (random(`${tag}-ba${s}`) - 0.5) * 1.8, len * 0.45, w * 0.6, depth + 1, delay + (s / steps) * 0.4, `${tag}-${s}`);
      }
    }
    segs.push({d, w, delay});
  };
  for (let i = 0; i < rays; i++) {
    const a = (i / rays) * Math.PI * 2 + random(`${seed}-r${i}`) * 0.6;
    walk(cx, cy, a, radius * (0.55 + random(`${seed}-len${i}`) * 0.6), 2.2, 0, random(`${seed}-d${i}`) * 0.15, `${seed}-${i}`);
  }
  // концентрические «кольца» вокруг точки удара
  for (let ring = 1; ring <= 2; ring++) {
    const rr = radius * 0.16 * ring;
    let d = '';
    const n = 9 + ring * 3;
    for (let k = 0; k <= n; k++) {
      const a = (k / n) * Math.PI * 2;
      const j = rr * (0.8 + random(`${seed}-ring${ring}-${k}`) * 0.4);
      d += `${k === 0 ? 'M' : 'L'}${(cx + Math.cos(a) * j).toFixed(1)},${(cy + Math.sin(a) * j).toFixed(1)} `;
    }
    segs.push({d, w: 1.2, delay: 0.25 + ring * 0.1});
  }
  return segs;
};

/** Трещины, прорисовывающиеся по stroke-dashoffset. progress 0..1. Рисуется внутри <svg>. */
export const GlassCracks: React.FC<{
  seed: string;
  cx: number;
  cy: number;
  radius: number;
  rays?: number;
  progress: number;
  color?: string;
  opacity?: number;
  clipPath?: string;
}> = ({seed, cx, cy, radius, rays = 9, progress, color = '#C9D2D4', opacity = 0.8, clipPath}) => {
  const segs = useMemo(() => buildCracks(seed, cx, cy, radius, rays), [seed, cx, cy, radius, rays]);
  if (progress <= 0) return null;
  return (
    <g clipPath={clipPath} opacity={opacity}>
      {segs.map((s, i) => {
        const p = Math.max(0, Math.min(1, (progress - s.delay) / (1 - s.delay)));
        if (p <= 0) return null;
        return (
          <g key={i}>
            <path d={s.d} pathLength={1} fill="none" stroke="#000" strokeOpacity={0.5} strokeWidth={s.w + 1.5} strokeDasharray="1 1" strokeDashoffset={1 - p} strokeLinejoin="round" />
            <path d={s.d} pathLength={1} fill="none" stroke={color} strokeWidth={s.w} strokeDasharray="1 1" strokeDashoffset={1 - p} strokeLinejoin="round" />
          </g>
        );
      })}
    </g>
  );
};
