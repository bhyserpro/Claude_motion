import React from 'react';
import {AbsoluteFill, interpolate, useCurrentFrame} from 'remotion';
import {UI} from '../../config';
import {FONT_SERIF} from '../../lib/fonts';

/** «ПЕРЕГОН · Серия N. Название» на чёрном. */
export const TitleCard: React.FC<{episode?: number; title: string; delay?: number; dur: number; main?: string}> = ({
  episode,
  title,
  delay = 0,
  dur,
  main = 'ПЕРЕГОН',
}) => {
  const frame = useCurrentFrame();
  const a = interpolate(frame, [delay, delay + 20, dur - 15, dur], [0, 1, 1, 0.0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const spread = interpolate(frame, [delay, dur], [10, 16], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  return (
    <AbsoluteFill style={{background: '#000', alignItems: 'center', justifyContent: 'center'}}>
      <div style={{opacity: a, textAlign: 'center', fontFamily: FONT_SERIF, color: '#D8D3C8'}}>
        <div style={{fontSize: 74 * UI, letterSpacing: spread * UI, fontWeight: 700}}>{main}</div>
        <div style={{width: 60 * UI, height: 2 * UI, background: '#7A1712', margin: `${26 * UI}px auto`}} />
        <div style={{fontSize: 34 * UI, letterSpacing: 2 * UI, color: '#A8A399'}}>
          {episode ? `Серия ${episode}. ` : ''}
          {title}
        </div>
      </div>
    </AbsoluteFill>
  );
};
