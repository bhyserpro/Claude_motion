import React from 'react';
import {random} from 'remotion';
import {Ctx, View} from './Rig';

// Общие детали голов и тел для персонажей.

/** Смещение черт/причёски для ракурса. */
export const viewOff = (view: View, R: number) => (view === 'front' || view === 'back' ? 0 : view === 'three_quarter' ? -R * 0.12 : -R * 0.25);

/** Волосы-«шлем»: верх головы до линии уровня brow. */
export const HairCap: React.FC<{k: Ctx; color: string; line?: number; sideDepth?: number}> = ({k, color, line = -0.38, sideDepth = 0.15}) => {
  const R = k.h / 2;
  const {c, view} = k;
  if (view === 'back') {
    return <path d={`M${-R * 1.04},${R * 0.1} A${R * 1.04},${R * 1.04} 0 0 1 ${R * 1.04},${R * 0.1} L${R * 0.9},${R * 0.5} Q0,${R * 0.62} ${-R * 0.9},${R * 0.5} Z`} fill={c(color)} />;
  }
  const off = viewOff(view, R);
  return (
    <path
      d={`M${-R * 1.04},${R * sideDepth} A${R * 1.04},${R * 1.04} 0 0 1 ${R * 1.04},${R * sideDepth} Q${R * 0.75},${R * line} ${off},${R * (line - 0.06)} Q${-R * 0.75},${R * line} ${-R * 1.04},${R * sideDepth} Z`}
      fill={c(color)}
    />
  );
};

/** Короткая «тень» стрижки под ноль. */
export const Buzz: React.FC<{k: Ctx; color: string; opacity?: number}> = ({k, color, opacity = 0.4}) => {
  const R = k.h / 2;
  return <path d={`M${-R},${-R * 0.05} A${R},${R} 0 0 1 ${R},${-R * 0.05} Q0,${-R * 0.5} ${-R},${-R * 0.05} Z`} fill={k.c(color)} opacity={opacity} />;
};

/** Блик на мокрой/лысой голове. */
export const Shine: React.FC<{k: Ctx; color?: string; opacity?: number}> = ({k, color = '#ffffff', opacity = 0.25}) => {
  const R = k.h / 2;
  if (k.rim) return null;
  return <ellipse cx={-R * 0.3} cy={-R * 0.6} rx={R * 0.32} ry={R * 0.1} fill={color} opacity={opacity} transform={`rotate(-25 ${-R * 0.3} ${-R * 0.6})`} />;
};

/** Круглые очки. */
export const Glasses: React.FC<{k: Ctx; color?: string; glint?: boolean}> = ({k, color = '#3A3833', glint}) => {
  const R = k.h / 2;
  const off = -viewOff(k.view, R) * 2.2;
  const g = R * 0.3;
  const r = R * 0.18;
  if (k.view === 'back') return null;
  const far = k.view === 'profile' ? 0 : 1;
  return (
    <g fill="none" stroke={k.c(color)} strokeWidth={R * 0.04}>
      <circle cx={off - g} cy={R * 0.02} r={r} />
      {far ? <circle cx={off + g} cy={R * 0.02} r={r * (k.view === 'three_quarter' ? 0.8 : 1)} /> : null}
      <line x1={off - g + r} y1={R * 0.0} x2={off + g - r} y2={R * 0.0} />
      {glint && !k.rim ? (
        <g stroke="none">
          <ellipse cx={off - g - r * 0.3} cy={-r * 0.3} rx={r * 0.35} ry={r * 0.18} fill="#E6E8E2" opacity={0.8} />
          {far ? <ellipse cx={off + g - r * 0.3} cy={-r * 0.3} rx={r * 0.3} ry={r * 0.16} fill="#E6E8E2" opacity={0.8} /> : null}
        </g>
      ) : null}
    </g>
  );
};

/** Свисающие лоскуты кожи. points — точки крепления (в локальных координатах), lag — фаза качания. */
export const SkinStrips: React.FC<{
  k: Ctx;
  seed: string;
  n: number;
  area: [number, number, number, number]; // x, y, w, h
  len?: number;
  sway?: number; // текущая скорость движения (для вторичной анимации)
}> = ({k, seed, n, area, len = 0.32, sway = 0}) => {
  const {c, h, frame} = k;
  const items: React.ReactNode[] = [];
  for (let i = 0; i < n; i++) {
    const x = area[0] + random(`${seed}-sx${i}`) * area[2];
    const y = area[1] + random(`${seed}-sy${i}`) * area[3];
    const L = h * len * (0.5 + random(`${seed}-sl${i}`) * 0.8);
    const w = h * (0.04 + random(`${seed}-sw${i}`) * 0.05);
    // качание с запаздыванием 4–6 кадров относительно движения
    const lag = 4 + Math.floor(random(`${seed}-lag${i}`) * 3);
    const ang = Math.sin((frame - lag) / 9 + i) * 6 * sway + (random(`${seed}-a${i}`) - 0.5) * 18;
    const bend = (random(`${seed}-b${i}`) - 0.5) * w * 3;
    items.push(
      <g key={i} transform={`translate(${x},${y}) rotate(${ang})`}>
        <path d={`M${-w / 2},0 Q${-w / 2 + bend},${L * 0.6} ${bend * 0.6},${L} Q${w / 2 + bend},${L * 0.6} ${w / 2},0 Z`} fill={c('#E8E2D8')} />
        <path d={`M${w * 0.1},0 Q${w * 0.1 + bend},${L * 0.6} ${bend * 0.6},${L} Q${w / 2 + bend},${L * 0.6} ${w / 2},0 Z`} fill={c('#A69E92')} />
      </g>,
    );
  }
  return <g>{items}</g>;
};

/** Пятна ожогов. */
export const Burns: React.FC<{k: Ctx; seed: string; n: number; area: [number, number, number, number]}> = ({k, seed, n, area}) => {
  const {c, h} = k;
  return (
    <g>
      {Array.from({length: n}).map((_, i) => {
        const x = area[0] + random(`${seed}-bx${i}`) * area[2];
        const y = area[1] + random(`${seed}-by${i}`) * area[3];
        const r = h * (0.04 + random(`${seed}-br${i}`) * 0.07);
        const pts = Array.from({length: 6}).map((__, j) => {
          const a = (j / 6) * Math.PI * 2;
          const rr = r * (0.6 + random(`${seed}-bp${i}-${j}`) * 0.6);
          return `${(x + Math.cos(a) * rr).toFixed(1)},${(y + Math.sin(a) * rr * 0.8).toFixed(1)}`;
        });
        return <polygon key={i} points={pts.join(' ')} fill={c(i % 2 ? '#3E1E19' : '#5B2A22')} opacity={0.85} />;
      })}
    </g>
  );
};

/** Длинная узкая кисть с отдельными пальцами (крупные планы, жест «палец к губам»). */
export const LongHand: React.FC<{
  c: (s: string) => string;
  len: number;
  skin: string;
  shade: string;
  nails?: string;
  pose?: 'point_up' | 'open' | 'reach' | 'relaxed';
  strips?: boolean;
  seed?: string;
}> = ({c, len, skin, shade, nails = '#3a2d2a', pose = 'open', strips = false, seed = 'lh'}) => {
  const pw = len * 0.42;
  const ph = len * 0.48;
  const fingers = [
    {x: -pw * 0.36, l: 0.48},
    {x: -pw * 0.12, l: 0.58},
    {x: pw * 0.12, l: 0.55},
    {x: pw * 0.34, l: 0.44},
  ];
  const fw = pw * 0.2;
  return (
    <g>
      <rect x={-pw / 2} y={0} width={pw} height={ph} rx={pw * 0.25} fill={c(skin)} />
      <rect x={pw * 0.05} y={ph * 0.1} width={pw * 0.45} height={ph * 0.85} rx={pw * 0.2} fill={c(shade)} opacity={0.5} />
      {fingers.map((f, i) => {
        const folded = pose === 'point_up' && i !== 1;
        const L = len * f.l * (folded ? 0.35 : pose === 'point_up' ? 1.35 : 1);
        const curl = pose === 'relaxed' ? 8 + i * 4 : pose === 'reach' ? -4 + i * 3 : 0;
        return (
          <g key={i} transform={`translate(${f.x},${ph * 0.92}) rotate(${curl})`}>
            <rect x={-fw / 2} y={0} width={fw} height={L} rx={fw / 2} fill={c(skin)} />
            {!folded ? <rect x={-fw * 0.32} y={L - fw * 0.9} width={fw * 0.64} height={fw * 0.7} rx={fw * 0.25} fill={c(nails)} /> : null}
          </g>
        );
      })}
      {/* большой палец */}
      <g transform={`translate(${-pw * 0.5},${ph * 0.35}) rotate(${pose === 'point_up' ? 40 : 30})`}>
        <rect x={-fw / 2} y={0} width={fw * 1.1} height={len * 0.36} rx={fw / 2} fill={c(skin)} />
      </g>
      {strips ? (
        <g>
          {[0, 1].map((i) => (
            <path
              key={i}
              d={`M${-pw * 0.3 + i * pw * 0.4},${ph * 0.2} q${pw * 0.1},${ph * 0.5} ${-pw * 0.05},${ph * 0.9} l${pw * 0.12},0 q${pw * 0.05},${-ph * 0.5} ${0},${-ph * 0.9} Z`}
              fill={c(random(`${seed}${i}`) > 0.5 ? '#E8E2D8' : '#d8d0c4')}
            />
          ))}
        </g>
      ) : null}
    </g>
  );
};

/** Рюкзак за спиной (рисуется в слоте behind). */
export const Backpack: React.FC<{k: Ctx; color: string; w: number; hgt: number; square?: boolean; y?: number}> = ({k, color, w, hgt, square, y}) => {
  const {c, h, view} = k;
  const dx = view === 'front' ? 0 : view === 'back' ? 0 : -w * 0.55;
  const top = y ?? -1.72 * h + 0.1 * h;
  if (view === 'front') {
    // анфас рюкзак выглядывает над плечами — это его силуэтная метка
    return <rect x={-w / 2} y={top - (square ? 0.42 : 0.22) * h} width={w} height={hgt} rx={square ? 0.04 * h : 0.15 * h} fill={c(color)} />;
  }
  return <rect x={dx - w / 2} y={top} width={w} height={hgt} rx={square ? 0.04 * h : 0.15 * h} fill={c(color)} />;
};
