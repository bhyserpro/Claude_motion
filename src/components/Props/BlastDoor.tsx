import React from 'react';
import {random} from 'remotion';
import {FONT_MONO} from '../../lib/fonts';

/**
 * Гермозатвор крупным планом (плоско, для вставок акта осмотра).
 * scratches 0..1 — царапины ногтями; blood — следы на царапинах.
 */
export const BlastDoorClose: React.FC<{scratches?: number; blood?: number; tint?: string; seed?: string; shake?: number}> = ({
  scratches = 1,
  blood = 0.6,
  tint = '#D9E4E8',
  seed = 'bd',
  shake = 0,
}) => {
  const lines: React.ReactNode[] = [];
  for (let i = 0; i < 60; i++) {
    const x = 380 + random(`${seed}-x${i}`) * 1160;
    const y = 360 + random(`${seed}-y${i}`) * 420;
    const l = 40 + random(`${seed}-l${i}`) * 180;
    const dx = (random(`${seed}-d${i}`) - 0.5) * 30;
    const grp = Math.floor(random(`${seed}-g${i}`) * 4);
    // царапины идут пучками по 3–4 (пальцы)
    for (let f = 0; f < 3; f++) {
      lines.push(
        <line
          key={`${i}-${f}`}
          x1={x + f * 14}
          y1={y}
          x2={x + f * 14 + dx}
          y2={y + l}
          stroke="#c6ccc8"
          strokeWidth={2.4 - f * 0.4}
          opacity={scratches * (0.45 + grp * 0.12)}
        />,
      );
    }
    if (blood > 0 && i % 4 === 0) lines.push(<line key={`b${i}`} x1={x + 3} y1={y + l * 0.55} x2={x + 3 + dx * 0.4} y2={y + l} stroke="#5a1612" strokeWidth={3} opacity={blood} />);
  }
  return (
    <svg width={1920} height={1080} viewBox="0 0 1920 1080" style={{position: 'absolute', left: 0, top: 0}}>
      <g transform={`translate(${shake},0)`}>
        <rect x={-100} y={-100} width={2120} height={1280} fill="#2c322f" />
        {Array.from({length: 6}).map((_, i) => (
          <g key={i}>
            <rect x={-100} y={140 + i * 170} width={2120} height={34} fill="#232826" />
            <rect x={-100} y={140 + i * 170} width={2120} height={6} fill="#4a524e" />
          </g>
        ))}
        {Array.from({length: 22}).map((_, i) => (
          <circle key={i} cx={60 + i * 90} cy={110} r={11} fill="#4a524e" />
        ))}
        <rect x={1420} y={180} width={300} height={90} fill="#6a5a2a" />
        <text x={1570} y={240} textAnchor="middle" fontFamily={FONT_MONO} fontSize={52} fill="#1a1a14">
          ГЗ-3
        </text>
        {lines}
        <rect x={-100} y={-100} width={2120} height={1280} fill={tint} opacity={0.06} />
      </g>
    </svg>
  );
};
