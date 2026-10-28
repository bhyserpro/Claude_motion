import React from 'react';
import {AbsoluteFill, interpolate, random, useCurrentFrame} from 'remotion';
import {BAR_H, UI, WIDTH} from '../../config';
import {FONT_MONO} from '../../lib/fonts';

/** «ДЕНЬ N — ЧЧ:ММ», моно, верхний левый угол, тускло, лёгкое мерцание. suffix гаснет к suffixEnd. */
export const Timestamp: React.FC<{text: string; suffix?: string; start?: number; end?: number; suffixEnd?: number}> = ({
  text,
  suffix,
  start = 0,
  end,
  suffixEnd = 120,
}) => {
  const frame = useCurrentFrame();
  if (frame < start || (end !== undefined && frame >= end)) return null;
  const flick = 0.62 + random(`ts-${Math.floor(frame / 2)}`) * 0.1 - (random(`tsd-${Math.floor(frame / 5)}`) < 0.04 ? 0.35 : 0);
  const a = interpolate(frame, [start, start + 3], [0, 1], {extrapolateRight: 'clamp'}) *
    (end !== undefined ? interpolate(frame, [end - 8, end], [1, 0], {extrapolateLeft: 'clamp'}) : 1);
  const sa = interpolate(frame, [start + suffixEnd - 20, start + suffixEnd], [1, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const size = 25 * UI;
  const bar = BAR_H > 60 ? BAR_H : 110;
  return (
    <AbsoluteFill style={{pointerEvents: 'none', opacity: a * flick}}>
      <div
        style={{
          position: 'absolute',
          left: WIDTH * 0.045,
          top: (bar - size * 1.2) / 2 + 4 * UI,
          fontFamily: FONT_MONO,
          fontSize: size,
          letterSpacing: 2 * UI,
          color: '#A9ADA6',
          whiteSpace: 'pre',
        }}
      >
        {text}
        {suffix ? <span style={{opacity: sa, color: '#8E7C74'}}>{`  ·  ${suffix}`}</span> : null}
      </div>
    </AbsoluteFill>
  );
};
