import React from 'react';
import {AbsoluteFill, random, useCurrentFrame} from 'remotion';
import {noise1} from '../../lib/noise';

/**
 * Яркость аварийного/неисправного света 0..1 для кадра.
 * base — средняя яркость, depth — глубина колебаний, dropRate — частота провалов (в секунду).
 */
export const flickerValue = (
  frame: number,
  seed: string,
  {base = 1, depth = 0.12, dropRate = 0.15, dropLen = 3}: {base?: number; depth?: number; dropRate?: number; dropLen?: number} = {},
) => {
  let v = base + noise1(seed, frame / 6) * depth * 0.6 + (random(`${seed}-j-${frame}`) - 0.5) * depth * 0.4;
  // редкие провалы на несколько кадров
  const bucket = Math.floor(frame / dropLen);
  if (random(`${seed}-drop-${bucket}`) < dropRate / (30 / dropLen)) v *= 0.25;
  return Math.max(0, Math.min(1.2, v));
};

/** Затемняющая подложка поверх сцены по закону мерцания. */
export const Flicker: React.FC<{seed?: string; base?: number; depth?: number; dropRate?: number; color?: string}> = ({
  seed = 'flk',
  base = 1,
  depth = 0.12,
  dropRate = 0.15,
  color = '#000',
}) => {
  const frame = useCurrentFrame();
  const v = flickerValue(frame, seed, {base, depth, dropRate});
  return <AbsoluteFill style={{background: color, opacity: Math.max(0, Math.min(1, 1 - v)), pointerEvents: 'none'}} />;
};
