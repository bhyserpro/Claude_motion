import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {HEIGHT, WIDTH} from '../../config';

/** Один полноэкранный слой зерна. Seed меняется каждые 2 кадра; шум считается в половинном разрешении. */
export const FilmGrain: React.FC<{opacity?: number; seed?: number}> = ({opacity = 0.16, seed = 0}) => {
  const frame = useCurrentFrame();
  const s = (Math.floor(frame / 2) * 7 + seed) % 997;
  const w = Math.round(WIDTH / 2);
  const h = Math.round(HEIGHT / 2);
  return (
    <AbsoluteFill style={{pointerEvents: 'none', mixBlendMode: 'overlay', opacity}}>
      <svg
        width={w}
        height={h}
        viewBox={`0 0 ${w} ${h}`}
        style={{position: 'absolute', left: 0, top: 0, transformOrigin: '0 0', transform: 'scale(2)'}}
      >
        <filter id={`grain-${s}`} x="0" y="0" width="100%" height="100%">
          <feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves={1} seed={s} stitchTiles="stitch" />
          <feColorMatrix type="matrix" values="0 0 0 0 0.5  0 0 0 0 0.5  0 0 0 0 0.5  1.6 0 0 0 -0.3" />
        </filter>
        <rect width={w} height={h} fill="#808080" />
        <rect width={w} height={h} filter={`url(#grain-${s})`} />
      </svg>
    </AbsoluteFill>
  );
};
