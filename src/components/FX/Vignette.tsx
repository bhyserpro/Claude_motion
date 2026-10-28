import React from 'react';
import {AbsoluteFill} from 'remotion';

export const Vignette: React.FC<{strength?: number; color?: string}> = ({strength = 0.85, color = '7,9,10'}) => (
  <AbsoluteFill
    style={{
      pointerEvents: 'none',
      background: `radial-gradient(ellipse 75% 70% at 50% 50%, rgba(${color},0) 45%, rgba(${color},${strength * 0.55}) 75%, rgba(${color},${strength}) 100%)`,
    }}
  />
);
