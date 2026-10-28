import React from 'react';
import {DH, DW} from '../../config';

export type Beam = {
  sx: number; // источник
  sy: number;
  tx: number; // центр пятна
  ty: number;
  r: number; // радиус пятна
  intensity?: number; // 0..1
  stretch?: number; // вытянутость пятна вдоль луча
  color?: string;
};

/**
 * Всё в темноте, видно только в конусе фонаря. Рисуется внутри Stage (дизайн-координаты).
 * darkness — непрозрачность тьмы вне луча.
 */
export const FlashlightMask: React.FC<{beams: Beam[]; darkness?: number; id: string; color?: string; haze?: number}> = ({
  beams,
  darkness = 0.97,
  id,
  color = '#030404',
  haze = 0.12,
}) => {
  const pad = 800;
  return (
    <svg
      width={DW}
      height={DH}
      viewBox={`0 0 ${DW} ${DH}`}
      style={{position: 'absolute', left: 0, top: 0, overflow: 'visible', pointerEvents: 'none'}}
    >
      <defs>
        <radialGradient id={`${id}-spot`}>
          <stop offset="0%" stopColor="#000" />
          <stop offset="45%" stopColor="#000" stopOpacity={0.92} />
          <stop offset="75%" stopColor="#000" stopOpacity={0.45} />
          <stop offset="100%" stopColor="#000" stopOpacity={0} />
        </radialGradient>
        {beams.map((b, i) => (
          <radialGradient key={i} id={`${id}-glow${i}`}>
            <stop offset="0%" stopColor={b.color ?? '#D9E4E8'} stopOpacity={0.22 * (b.intensity ?? 1)} />
            <stop offset="100%" stopColor={b.color ?? '#D9E4E8'} stopOpacity={0} />
          </radialGradient>
        ))}
        <mask id={`${id}-m`} maskUnits="userSpaceOnUse" x={-pad} y={-pad} width={DW + pad * 2} height={DH + pad * 2}>
          <rect x={-pad} y={-pad} width={DW + pad * 2} height={DH + pad * 2} fill="#fff" />
          {beams.map((b, i) => {
            const k = b.intensity ?? 1;
            if (k <= 0.001) return null;
            const ang = (Math.atan2(b.ty - b.sy, b.tx - b.sx) * 180) / Math.PI;
            const st = b.stretch ?? 1.25;
            // конус от источника до пятна
            const dx = b.tx - b.sx;
            const dy = b.ty - b.sy;
            const len = Math.max(1, Math.hypot(dx, dy));
            const nx = -dy / len;
            const ny = dx / len;
            const w0 = b.r * 0.08;
            const w1 = b.r * 0.85;
            const cone = [
              [b.sx + nx * w0, b.sy + ny * w0],
              [b.tx + nx * w1, b.ty + ny * w1],
              [b.tx - nx * w1, b.ty - ny * w1],
              [b.sx - nx * w0, b.sy - ny * w0],
            ]
              .map((p) => p.join(','))
              .join(' ');
            return (
              <g key={i} opacity={k}>
                <polygon points={cone} fill="#000" opacity={haze} />
                <ellipse
                  cx={b.tx}
                  cy={b.ty}
                  rx={b.r * st}
                  ry={b.r}
                  fill={`url(#${id}-spot)`}
                  transform={`rotate(${ang} ${b.tx} ${b.ty})`}
                />
              </g>
            );
          })}
        </mask>
      </defs>
      <rect x={-pad} y={-pad} width={DW + pad * 2} height={DH + pad * 2} fill={color} opacity={darkness} mask={`url(#${id}-m)`} />
      <g style={{mixBlendMode: 'screen'}}>
        {beams.map((b, i) =>
          (b.intensity ?? 1) > 0.001 ? (
            <ellipse key={i} cx={b.tx} cy={b.ty} rx={b.r * 1.1} ry={b.r * 0.95} fill={`url(#${id}-glow${i})`} opacity={b.intensity ?? 1} />
          ) : null,
        )}
      </g>
    </svg>
  );
};
