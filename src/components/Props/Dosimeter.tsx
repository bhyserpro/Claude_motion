import React from 'react';
import {FONT_MONO} from '../../lib/fonts';

/**
 * Дозиметр крупным планом (рисуется внутри <svg>, центр в (x, y), ширина корпуса ~ 300*scale).
 * variant: 'nina' — личный тёмный; 'pavel' — служебный жёлтый.
 */
export const Dosimeter: React.FC<{
  x: number;
  y: number;
  scale?: number;
  variant?: 'nina' | 'pavel';
  value: string;
  unit?: string;
  led?: boolean;
  lcdOn?: boolean;
  light?: 'warm' | 'flashlight' | 'emergency' | 'dark';
  rotate?: number;
  warn?: boolean;
}> = ({x, y, scale = 1, variant = 'nina', value, unit = 'мкЗв/ч', led = false, lcdOn = true, light = 'warm', rotate = 0, warn = false}) => {
  const body = variant === 'pavel' ? '#A88A2E' : '#2C2F2C';
  const bodyShade = variant === 'pavel' ? '#86701f' : '#1d201d';
  const tint = light === 'emergency' ? 'rgba(90,10,6,0.55)' : light === 'dark' ? 'rgba(5,6,6,0.7)' : light === 'flashlight' ? 'rgba(217,228,232,0.12)' : 'rgba(0,0,0,0)';
  const W = 300;
  const H = 440;
  return (
    <g transform={`translate(${x},${y}) rotate(${rotate}) scale(${scale})`}>
      <rect x={-W / 2 + 10} y={-H / 2 + 14} width={W} height={H} rx={34} fill="#000" opacity={0.45} />
      <rect x={-W / 2} y={-H / 2} width={W} height={H} rx={34} fill={body} />
      <rect x={W * 0.18} y={-H / 2} width={W * 0.32} height={H} rx={20} fill={bodyShade} opacity={0.6} />
      {/* ЖК-окно */}
      <rect x={-W * 0.38} y={-H * 0.36} width={W * 0.76} height={H * 0.3} rx={10} fill="#1a1d14" />
      <rect x={-W * 0.34} y={-H * 0.33} width={W * 0.68} height={H * 0.24} rx={6} fill={lcdOn ? '#B9C64A' : '#4a4f2e'} />
      {lcdOn ? (
        <g>
          <text x={W * 0.3} y={-H * 0.17} textAnchor="end" fontFamily={FONT_MONO} fontWeight={500} fontSize={64} fill="#2b3010" opacity={0.12}>
            {value.replace(/[0-9]/g, '8')}
          </text>
          <text x={W * 0.3} y={-H * 0.17} textAnchor="end" fontFamily={FONT_MONO} fontWeight={500} fontSize={64} fill="#1e220a">
            {value}
          </text>
          <text x={W * 0.3} y={-H * 0.115} textAnchor="end" fontFamily={FONT_MONO} fontSize={20} fill="#2b3010">
            {unit}
          </text>
          {warn ? (
            <text x={-W * 0.31} y={-H * 0.27} fontFamily={FONT_MONO} fontSize={18} fill="#2b3010">
              ▲ ТРЕВОГА
            </text>
          ) : null}
        </g>
      ) : null}
      {/* индикатор щелчка */}
      <circle cx={-W * 0.3} cy={H * 0.04} r={9} fill={led ? '#E0442E' : '#3a1210'} />
      {led ? <circle cx={-W * 0.3} cy={H * 0.04} r={26} fill="#E0442E" opacity={0.25} /> : null}
      {/* решётка датчика */}
      {Array.from({length: 6}).map((_, i) => (
        <rect key={i} x={-W * 0.3} y={H * 0.14 + i * 18} width={W * 0.6} height={7} rx={3} fill="#000" opacity={0.35} />
      ))}
      {/* кнопки */}
      <circle cx={W * 0.12} cy={H * 0.04} r={16} fill={bodyShade} />
      <circle cx={W * 0.28} cy={H * 0.04} r={16} fill={bodyShade} />
      <text x={0} y={H * 0.45} textAnchor="middle" fontFamily={FONT_MONO} fontSize={16} fill={variant === 'pavel' ? '#4a3c10' : '#6a6e66'}>
        {variant === 'pavel' ? 'ДКС-04 · СЛУЖЕБНЫЙ' : 'ДБГ-1М'}
      </text>
      <rect x={-W / 2} y={-H / 2} width={W} height={H} rx={34} fill={tint} />
    </g>
  );
};
