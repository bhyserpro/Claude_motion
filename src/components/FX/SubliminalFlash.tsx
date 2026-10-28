import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';

/** Вставка на 2–3 кадра поверх всего. */
export const SubliminalFlash: React.FC<{at: number; dur?: number; children: React.ReactNode}> = ({at, dur = 3, children}) => {
  const frame = useCurrentFrame();
  if (frame < at || frame >= at + dur) return null;
  return <AbsoluteFill>{children}</AbsoluteFill>;
};
