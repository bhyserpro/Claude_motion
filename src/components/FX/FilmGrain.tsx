import React, {useLayoutEffect, useRef} from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {HEIGHT, WIDTH} from '../../config';

// Быстрый детерминированный PRNG (mulberry32): тот же seed → то же зерно в любом рендере.
const mulberry32 = (a: number) => () => {
  a |= 0;
  a = (a + 0x6d2b79f5) | 0;
  let t = Math.imul(a ^ (a >>> 15), 1 | a);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
};

const GW = 640;
const GH = 360;

/**
 * Один полноэкранный слой зерна. Seed меняется каждые 2 кадра.
 * Шум считается на canvas в 1/3 разрешения и растягивается — это в разы дешевле feTurbulence.
 */
export const FilmGrain: React.FC<{opacity?: number; seed?: number}> = ({opacity = 0.16, seed = 0}) => {
  const frame = useCurrentFrame();
  const s = Math.floor(frame / 2) * 7919 + seed * 104729 + 17;
  const ref = useRef<HTMLCanvasElement>(null);
  useLayoutEffect(() => {
    const cv = ref.current;
    if (!cv) return;
    const ctx = cv.getContext('2d');
    if (!ctx) return;
    const img = ctx.createImageData(GW, GH);
    const rnd = mulberry32(s);
    const d = img.data;
    for (let i = 0; i < d.length; i += 4) {
      // сумма двух равномерных — мягкое, ближе к гауссову зерно
      const v = ((rnd() + rnd()) * 0.5 - 0.5) * 2;
      const g = 128 + v * 110;
      d[i] = g;
      d[i + 1] = g;
      d[i + 2] = g;
      d[i + 3] = 255;
    }
    ctx.putImageData(img, 0, 0);
  }, [s]);
  return (
    <AbsoluteFill style={{pointerEvents: 'none', mixBlendMode: 'overlay', opacity}}>
      <canvas ref={ref} width={GW} height={GH} style={{width: WIDTH, height: HEIGHT}} />
    </AbsoluteFill>
  );
};
