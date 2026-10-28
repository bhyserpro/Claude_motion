import React from 'react';
import {FONT_MONO, FONT_SERIF} from '../../lib/fonts';

/** Экран телефона с застывшим временем «18:47». */
export const PhoneScreen: React.FC<{x: number; y: number; w: number; time?: string; rotate?: number; cracked?: boolean; glow?: number; noNet?: boolean}> = ({
  x,
  y,
  w,
  time = '18:47',
  rotate = 0,
  cracked = false,
  glow = 1,
  noNet = true,
}) => {
  const h = w * 2.05;
  return (
    <g transform={`translate(${x},${y}) rotate(${rotate})`}>
      <rect x={-w / 2 - w * 0.06} y={-h / 2 - w * 0.06} width={w * 1.12} height={h + w * 0.12} rx={w * 0.14} fill="#0b0c0d" />
      <rect x={-w / 2} y={-h / 2} width={w} height={h} rx={w * 0.1} fill="#1b2630" opacity={glow} />
      <rect x={-w / 2} y={-h / 2} width={w} height={h * 0.6} rx={w * 0.1} fill="#2a3b48" opacity={glow * 0.6} />
      <text x={0} y={-h * 0.18} textAnchor="middle" fontFamily={FONT_SERIF} fontSize={w * 0.34} fill="#E6EDF0" opacity={glow}>
        {time}
      </text>
      <text x={0} y={-h * 0.08} textAnchor="middle" fontFamily={FONT_MONO} fontSize={w * 0.065} fill="#b7c3c9" opacity={glow * 0.8}>
        четверг, 14 октября
      </text>
      {noNet ? (
        <text x={-w * 0.4} y={-h * 0.42} fontFamily={FONT_MONO} fontSize={w * 0.06} fill="#b7c3c9" opacity={glow * 0.7}>
          Нет сети
        </text>
      ) : null}
      {cracked ? <path d={`M${-w * 0.3},${-h * 0.5} L${-w * 0.05},${-h * 0.1} L${w * 0.2},${h * 0.05} L${w * 0.5},${h * 0.3} M${-w * 0.05},${-h * 0.1} L${-w * 0.45},${h * 0.2}`} stroke="#d0dde2" strokeWidth={1.2} fill="none" opacity={0.6} /> : null}
    </g>
  );
};
