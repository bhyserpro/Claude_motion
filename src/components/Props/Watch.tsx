import React from 'react';

/** Наручные часы Глеба крупно: циферблат #CFC6B2, стрелки #1A1A1A. Время задаётся числами (с долями). */
export const Watch: React.FC<{x: number; y: number; r: number; h: number; m: number; s: number; tint?: string; tintA?: number}> = ({
  x,
  y,
  r,
  h,
  m,
  s,
  tint = '#000',
  tintA = 0,
}) => {
  const ha = ((h % 12) + m / 60) * 30;
  const ma = (m + s / 60) * 6;
  const sa = s * 6;
  return (
    <g transform={`translate(${x},${y})`}>
      <circle r={r * 1.22} fill="#2a2724" />
      <circle r={r * 1.12} fill="#8C8A84" />
      <circle r={r} fill="#CFC6B2" />
      {Array.from({length: 60}).map((_, i) => {
        const a = (i * 6 * Math.PI) / 180;
        const big = i % 5 === 0;
        const r0 = r * (big ? 0.8 : 0.88);
        return (
          <line
            key={i}
            x1={Math.sin(a) * r0}
            y1={-Math.cos(a) * r0}
            x2={Math.sin(a) * r * 0.94}
            y2={-Math.cos(a) * r * 0.94}
            stroke="#1A1A1A"
            strokeWidth={big ? r * 0.035 : r * 0.012}
          />
        );
      })}
      <rect x={-r * 0.035} y={-r * 0.5} width={r * 0.07} height={r * 0.58} rx={r * 0.03} fill="#1A1A1A" transform={`rotate(${ha})`} />
      <rect x={-r * 0.025} y={-r * 0.78} width={r * 0.05} height={r * 0.86} rx={r * 0.02} fill="#1A1A1A" transform={`rotate(${ma})`} />
      <g transform={`rotate(${sa})`}>
        <rect x={-r * 0.009} y={-r * 0.86} width={r * 0.018} height={r * 1.05} fill="#7A1712" />
        <circle r={r * 0.045} fill="#7A1712" />
      </g>
      <ellipse cx={-r * 0.35} cy={-r * 0.45} rx={r * 0.45} ry={r * 0.16} fill="#fff" opacity={0.12} transform={`rotate(-30 ${-r * 0.35} ${-r * 0.45})`} />
      {tintA > 0 ? <circle r={r * 1.22} fill={tint} opacity={tintA} /> : null}
    </g>
  );
};
