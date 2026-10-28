import React from 'react';

export type Glow = {x: number; y: number; r: number; color: string; a?: number; rx?: number; ry?: number};

/** Ореолы вокруг источников света (радиальные градиенты, без blur-фильтров). Рисуется внутри <svg>. */
export const Halation: React.FC<{glows: Glow[]; id: string; intensity?: number}> = ({glows, id, intensity = 1}) => (
  <g style={{mixBlendMode: 'screen'}}>
    <defs>
      {glows.map((g, i) => (
        <radialGradient key={i} id={`${id}-h${i}`}>
          <stop offset="0%" stopColor={g.color} stopOpacity={(g.a ?? 0.8) * intensity} />
          <stop offset="25%" stopColor={g.color} stopOpacity={(g.a ?? 0.8) * intensity * 0.45} />
          <stop offset="60%" stopColor={g.color} stopOpacity={(g.a ?? 0.8) * intensity * 0.12} />
          <stop offset="100%" stopColor={g.color} stopOpacity={0} />
        </radialGradient>
      ))}
    </defs>
    {glows.map((g, i) => (
      <ellipse key={i} cx={g.x} cy={g.y} rx={g.rx ?? g.r} ry={g.ry ?? g.r} fill={`url(#${id}-h${i})`} />
    ))}
  </g>
);
