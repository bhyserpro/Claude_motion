import React from 'react';
import {AbsoluteFill, interpolate, useCurrentFrame} from 'remotion';
import {HEIGHT, UI, WIDTH} from '../../config';
import {FONT_SERIF} from '../../lib/fonts';
import {PALETTE} from '../../theme/palette';
import {typeLines} from './typing';

/** Отрисовка строки с выделенным **словом** (аварийный красный). */
const renderMarked = (full: string, visible: number) => {
  const parts = full.split('**');
  const nodes: React.ReactNode[] = [];
  let left = visible;
  parts.forEach((p, i) => {
    if (left <= 0) return;
    const chunk = p.slice(0, left);
    left -= p.length;
    nodes.push(
      i % 2 === 1 ? (
        <span key={i} style={{color: PALETTE.emergencyGlow, textShadow: `0 0 ${18 * UI}px rgba(179,38,30,0.45)`}}>
          {chunk}
        </span>
      ) : (
        <span key={i}>{chunk}</span>
      ),
    );
  });
  return nodes;
};

/**
 * Текст хука: 2 фразы на «ты», ~35 символов/с, PT Serif 64px, слева от центра.
 * Первая строка начинается не позже 6-го кадра.
 */
export const HookText: React.FC<{lines: string[]; start?: number; cps?: number; end?: number; top?: number}> = ({
  lines,
  start = 3,
  cps = 35,
  end,
  top = 0.38,
}) => {
  const frame = useCurrentFrame();
  const {out} = typeLines(lines, frame, start, cps, 10);
  const fade = end ? interpolate(frame, [end - 8, end], [1, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'}) : 1;
  return (
    <AbsoluteFill style={{pointerEvents: 'none', opacity: fade, zIndex: 10}}>
      <div
        style={{
          position: 'absolute',
          left: WIDTH * 0.1,
          top: HEIGHT * top,
          width: WIDTH * 0.8,
          fontFamily: FONT_SERIF,
          fontSize: 64 * UI,
          lineHeight: 1.22,
          color: '#E9E6DF',
          textShadow: `0 ${3 * UI}px ${14 * UI}px rgba(0,0,0,0.9), 0 0 ${3 * UI}px rgba(0,0,0,0.9)`,
          letterSpacing: 0.2,
        }}
      >
        {lines.map((l, i) => (
          <div key={i} style={{minHeight: 64 * UI * 1.22, marginBottom: 8 * UI}}>
            {renderMarked(l, out[i].length)}
          </div>
        ))}
      </div>
    </AbsoluteFill>
  );
};
