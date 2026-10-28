import React from 'react';
import {AbsoluteFill, interpolate, useCurrentFrame} from 'remotion';
import {BAR_H, HEIGHT, UI} from '../../config';
import {FONT_SERIF} from '../../lib/fonts';

/** Реплика «ИМЯ — текст»: мелко, по центру внизу, в полосе летербокса, без плашек. */
export const Subtitle: React.FC<{
  who?: string;
  text: string;
  start?: number;
  end?: number;
  italic?: boolean;
  small?: boolean;
  color?: string;
}> = ({who, text, start = 0, end, italic = false, small = false, color = '#CFCBC2'}) => {
  const frame = useCurrentFrame();
  if (frame < start || (end !== undefined && frame >= end)) return null;
  const a =
    interpolate(frame, [start, start + 5], [0, 1], {extrapolateRight: 'clamp'}) *
    (end !== undefined ? interpolate(frame, [end - 6, end], [1, 0], {extrapolateLeft: 'clamp'}) : 1);
  const size = (small ? 23 : 29) * UI;
  const bar = BAR_H > 60 ? BAR_H : 120;
  return (
    <AbsoluteFill style={{pointerEvents: 'none', opacity: a, zIndex: 10}}>
      <div
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          top: HEIGHT - bar + (bar - size * 1.3) / 2 - 6 * UI,
          textAlign: 'center',
          fontFamily: FONT_SERIF,
          fontStyle: italic ? 'italic' : 'normal',
          fontSize: size,
          lineHeight: 1.3,
          color,
          letterSpacing: small ? 0.6 : 0.3,
          opacity: small ? 0.8 : 1,
        }}
      >
        {who ? <span style={{color: '#8F8B83', letterSpacing: 1.5 * UI}}>{who} — </span> : null}
        {text}
      </div>
    </AbsoluteFill>
  );
};
