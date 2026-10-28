import React from 'react';
import {random} from 'remotion';
import {mix} from '../../lib/color';
import {FONT_SERIF} from '../../lib/fonts';

/**
 * Мёртвый серый город на рассвете (финал). Слои для Stage25D:
 * CitySky (z≈12), CityFar (z≈7), CityMid (z≈3.5, с часами 18:47), CityStreet (z≈2), ShaftKiosk (z≈1.2).
 */
const HAZE = '#8b8a82';

export const CitySky: React.FC<{id: string}> = ({id}) => (
  <svg width={1920} height={1080} viewBox="0 0 1920 1080" style={{position: 'absolute', left: 0, top: 0, overflow: 'visible'}}>
    <defs>
      <linearGradient id={`${id}-sky`} x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#3f413f" />
        <stop offset="55%" stopColor="#7a7870" />
        <stop offset="80%" stopColor="#9a9282" />
        <stop offset="100%" stopColor="#8a8476" />
      </linearGradient>
      <radialGradient id={`${id}-sun`}>
        <stop offset="0%" stopColor="#d8cdb4" stopOpacity={0.55} />
        <stop offset="100%" stopColor="#d8cdb4" stopOpacity={0} />
      </radialGradient>
    </defs>
    <rect x={-1000} y={-600} width={3920} height={2400} fill={`url(#${id}-sky)`} />
    <ellipse cx={1320} cy={640} rx={420} ry={260} fill={`url(#${id}-sun)`} />
    <circle cx={1320} cy={660} r={46} fill="#d4cab2" opacity={0.35} />
  </svg>
);

const building = (seed: string, x: number, w: number, h: number, base: number, col: string, win: string, winA: number, rows: number) => {
  const els: React.ReactNode[] = [<rect key="b" x={x} y={base - h} width={w} height={h} fill={col} />];
  const cols = Math.max(2, Math.floor(w / 46));
  for (let r = 0; r < rows; r++) {
    for (let k = 0; k < cols; k++) {
      const wx = x + 14 + k * ((w - 28) / cols);
      const wy = base - h + 24 + r * ((h - 40) / rows);
      if (wy > base - 30) continue;
      const broken = random(`${seed}-w${r}-${k}`) < 0.12;
      els.push(<rect key={`w${r}-${k}`} x={wx} y={wy} width={(w - 28) / cols - 14} height={((h - 40) / rows) * 0.5} fill={broken ? '#0c0d0d' : win} opacity={winA} />);
    }
  }
  return <g key={seed}>{els}</g>;
};

export const CityFar: React.FC = () => {
  const els: React.ReactNode[] = [];
  let x = -900;
  let i = 0;
  while (x < 2900) {
    const w = 120 + random(`cf-w${i}`) * 220;
    const h = 220 + random(`cf-h${i}`) * 300;
    els.push(building(`cf${i}`, x, w, h, 760, mix('#4a4a46', HAZE, 0.55), '#3a3a36', 0.4, 6));
    x += w + 10 + random(`cf-g${i}`) * 50;
    i++;
  }
  return (
    <svg width={1920} height={1080} viewBox="0 0 1920 1080" style={{position: 'absolute', left: 0, top: 0, overflow: 'visible'}}>
      {els}
      {/* дымы */}
      <path d="M200,560 q40,-200 -20,-420 q60,-80 140,-60 q-60,180 -40,480 Z" fill="#3a3a38" opacity={0.25} />
      <path d="M1650,600 q60,-220 10,-460 q80,-40 120,10 q-70,200 -50,450 Z" fill="#3a3a38" opacity={0.22} />
    </svg>
  );
};

export const CityMid: React.FC<{clock?: string}> = ({clock = '18:47'}) => {
  const els: React.ReactNode[] = [];
  const specs: [number, number, number][] = [
    [-700, 420, 520],
    [-260, 360, 600],
    [180, 300, 460],
    [1240, 420, 640],
    [1700, 380, 520],
    [2120, 420, 580],
  ];
  specs.forEach(([x, w, h], i) => els.push(building(`cm${i}`, x, w, h, 820, mix('#34342f', HAZE, 0.28), '#1d1e1c', 0.85, 9)));
  // здание с часами
  const cx = 820;
  els.push(
    <g key="clock">
      <rect x={cx - 210} y={300} width={420} height={520} fill={mix('#3a3832', HAZE, 0.25)} />
      <rect x={cx - 120} y={140} width={240} height={180} fill={mix('#3a3832', HAZE, 0.22)} />
      <path d={`M${cx - 140},140 L${cx},40 L${cx + 140},140 Z`} fill={mix('#2c2b27', HAZE, 0.22)} />
      <rect x={cx - 92} y={170} width={184} height={110} rx={8} fill="#1a1b19" />
      <text x={cx} y={254} textAnchor="middle" fontFamily={FONT_SERIF} fontWeight={700} fontSize={78} fill="#c9c3a8" opacity={0.85}>
        {clock}
      </text>
      {Array.from({length: 5}).map((_, r) =>
        Array.from({length: 6}).map((__, k) => <rect key={`${r}-${k}`} x={cx - 180 + k * 62} y={350 + r * 92} width={36} height={50} fill="#1d1e1c" />),
      )}
    </g>,
  );
  return (
    <svg width={1920} height={1080} viewBox="0 0 1920 1080" style={{position: 'absolute', left: 0, top: 0, overflow: 'visible'}}>
      {els}
    </svg>
  );
};

const carShape = (x: number, y: number, s: number, col: string, key: string, flip = false) => (
  <g key={key} transform={`translate(${x},${y}) scale(${flip ? -s : s},${s})`}>
    <path d="M-180,0 L-180,-60 Q-170,-80 -120,-84 L-70,-140 L80,-140 L130,-84 L175,-78 Q190,-70 190,-40 L190,0 Z" fill={col} />
    <path d="M-60,-132 L-10,-132 L-10,-88 L-104,-88 Z M5,-132 L72,-132 L112,-88 L5,-88 Z" fill="#1a1b1a" />
    <circle cx={-110} cy={0} r={34} fill="#141514" />
    <circle cx={120} cy={0} r={34} fill="#141514" />
    {/* пепел на крыше и капоте */}
    <path d="M-70,-140 L80,-140 L84,-134 L-74,-134 Z" fill="#a7a59c" />
    <path d="M130,-84 L175,-78 L176,-72 L128,-78 Z" fill="#a7a59c" />
  </g>
);

export const CityStreet: React.FC = () => (
  <svg width={1920} height={1080} viewBox="0 0 1920 1080" style={{position: 'absolute', left: 0, top: 0, overflow: 'visible'}}>
    <rect x={-1200} y={820} width={4300} height={700} fill="#4d4c46" />
    <rect x={-1200} y={820} width={4300} height={16} fill="#5a5850" />
    {Array.from({length: 18}).map((_, i) => (
      <rect key={i} x={-1100 + i * 260} y={930} width={130} height={10} fill="#8a887e" opacity={0.5} />
    ))}
    {carShape(-260, 900, 1.1, '#3e403d', 'c1')}
    {carShape(420, 960, 1.25, '#4a3e36', 'c2', true)}
    {carShape(1500, 905, 1.1, '#33383a', 'c3')}
    {carShape(2260, 960, 1.25, '#3b3b36', 'c4', true)}
    {/* столб с громкоговорителем */}
    <rect x={1180} y={300} width={16} height={560} fill="#2a2a27" />
    <path d="M1196,330 l90,-30 l0,90 l-90,-30 Z" fill="#2a2a27" />
    <path d="M1180,360 l-90,-30 l0,90 l90,-30 Z" fill="#2a2a27" />
  </svg>
);

/** Будка вентшахты с открытой решёткой (выход ВШ-12 на поверхность). */
export const ShaftKiosk: React.FC<{x?: number; y?: number; open?: number}> = ({x = 1460, y = 1010, open = 1}) => (
  <svg width={1920} height={1080} viewBox="0 0 1920 1080" style={{position: 'absolute', left: 0, top: 0, overflow: 'visible'}}>
    <g transform={`translate(${x},${y})`}>
      <rect x={-260} y={-420} width={520} height={420} fill="#2f302c" />
      <path d="M-290,-420 L290,-420 L250,-470 L-250,-470 Z" fill="#262723" />
      {Array.from({length: 7}).map((_, i) => (
        <rect key={i} x={-230} y={-380 + i * 30} width={460} height={12} fill="#1e1f1c" />
      ))}
      <rect x={-130} y={-180} width={260} height={180} fill="#0b0c0c" />
      {/* решётка откинута */}
      <g transform={`translate(130,-180) rotate(${-open * 105})`}>
        {Array.from({length: 7}).map((_, i) => (
          <rect key={i} x={-2} y={i * 26} width={260} height={8} fill="#4a4a44" />
        ))}
        <rect x={0} y={0} width={8} height={180} fill="#4a4a44" />
        <rect x={252} y={0} width={8} height={180} fill="#4a4a44" />
      </g>
      <path d="M-300,-470 L300,-470 L310,-462 L-310,-462 Z" fill="#a7a59c" />
      <text x={0} y={-430} textAnchor="middle" fontFamily={FONT_SERIF} fontSize={26} fill="#8a887e">
        ВШ-12
      </text>
    </g>
  </svg>
);
