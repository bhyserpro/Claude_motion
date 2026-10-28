import React from 'react';
import {AbsoluteFill, interpolate, useCurrentFrame} from 'remotion';
import {HEIGHT, IMAGE_BOTTOM, UI, WIDTH} from '../../config';
import {FONT_SERIF} from '../../lib/fonts';
import {typeLines} from './typing';

/**
 * Монолог рассказчика: печатная машинка ~18 символов/с, внизу слева, максимум 2 строки.
 * end — кадр, к которому текст гаснет (по умолчанию держится до конца Sequence).
 */
export const Monologue: React.FC<{lines: string[]; start?: number; end?: number; cps?: number; dim?: number}> = ({
  lines,
  start = 0,
  end,
  cps = 18,
  dim = 1,
}) => {
  const frame = useCurrentFrame();
  if (frame < start) return null;
  const {out} = typeLines(lines, frame, start, cps, 8);
  const fadeIn = interpolate(frame, [start, start + 4], [0, 1], {extrapolateRight: 'clamp'});
  const fadeOut = end ? interpolate(frame, [end - 12, end], [1, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'}) : 1;
  return (
    <AbsoluteFill style={{pointerEvents: 'none', opacity: fadeIn * fadeOut * dim, zIndex: 10}}>
      <div
        style={{
          position: 'absolute',
          left: WIDTH * 0.065,
          bottom: HEIGHT - IMAGE_BOTTOM + 34 * UI,
          maxWidth: WIDTH * 0.62,
          fontFamily: FONT_SERIF,
          fontSize: 38 * UI,
          lineHeight: 1.35,
          color: '#DCD8CF',
          textShadow: `0 ${2 * UI}px ${10 * UI}px rgba(0,0,0,0.85), 0 0 ${2 * UI}px rgba(0,0,0,0.7)`,
        }}
      >
        {out.map((t, i) => (
          <div key={i} style={{minHeight: 38 * UI * 1.35, whiteSpace: 'pre'}}>
            {t}
          </div>
        ))}
      </div>
    </AbsoluteFill>
  );
};
