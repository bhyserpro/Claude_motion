import React from 'react';
import {Ctx} from './Rig';

export type HeldItemKind =
  | 'notebook'
  | 'phone'
  | 'phoneLit'
  | 'flashlight'
  | 'flashlightWarm'
  | 'pencil'
  | 'dosimeterNina'
  | 'dosimeterPavel'
  | 'baton'
  | 'bottle'
  | 'micro';

/** Предметы в руке. Координаты кисти: (0,0) — запястье, кисть вниз. */
export const HeldItem: React.FC<{kind: HeldItemKind; k: Ctx}> = ({kind, k}) => {
  const {c, h} = k;
  switch (kind) {
    case 'notebook':
      return (
        <g transform={`translate(${-0.05 * h},${0.12 * h}) rotate(-8)`}>
          <rect x={-0.28 * h} y={0} width={0.5 * h} height={0.66 * h} rx={0.03 * h} fill={c('#6E2F28')} />
          <rect x={-0.25 * h} y={0.03 * h} width={0.08 * h} height={0.6 * h} fill={c('#CFC6B2')} />
        </g>
      );
    case 'phone':
    case 'phoneLit':
      return (
        <g transform={`translate(0,${0.14 * h})`}>
          <rect x={-0.12 * h} y={0} width={0.24 * h} height={0.42 * h} rx={0.03 * h} fill={c('#141617')} />
          {kind === 'phoneLit' ? <rect x={-0.1 * h} y={0.02 * h} width={0.2 * h} height={0.38 * h} fill="#E8F0F2" /> : null}
        </g>
      );
    case 'flashlight':
    case 'flashlightWarm':
      return (
        <g transform={`translate(0,${0.18 * h}) rotate(-90)`}>
          <rect x={-0.1 * h} y={-0.07 * h} width={0.62 * h} height={0.14 * h} rx={0.03 * h} fill={c(kind === 'flashlightWarm' ? '#5A5A55' : '#2E2E2C')} />
          <rect x={0.48 * h} y={-0.1 * h} width={0.12 * h} height={0.2 * h} rx={0.02 * h} fill={c('#3a3a38')} />
          <rect x={0.58 * h} y={-0.08 * h} width={0.03 * h} height={0.16 * h} fill={kind === 'flashlightWarm' ? '#E8D3A0' : '#D9E4E8'} />
        </g>
      );
    case 'baton':
      return (
        <g transform={`translate(0,${0.18 * h}) rotate(-80)`}>
          <rect x={-0.15 * h} y={-0.06 * h} width={0.95 * h} height={0.12 * h} rx={0.04 * h} fill={c('#2E2E2C')} />
          <rect x={0.78 * h} y={-0.08 * h} width={0.05 * h} height={0.16 * h} fill="#D9E4E8" />
        </g>
      );
    case 'pencil':
      return <rect x={-0.02 * h} y={0.05 * h} width={0.04 * h} height={0.5 * h} fill={c('#7d6a3a')} transform="rotate(-30)" />;
    case 'dosimeterNina':
      return (
        <g transform={`translate(0,${0.1 * h})`}>
          <rect x={-0.16 * h} y={0} width={0.32 * h} height={0.44 * h} rx={0.05 * h} fill={c('#2C2F2C')} />
          <rect x={-0.11 * h} y={0.06 * h} width={0.22 * h} height={0.13 * h} fill="#B9C64A" opacity={k.rim ? 0 : 0.9} />
          <path d={`M0,0 Q${-0.2 * h},${-0.3 * h} ${-0.05 * h},${-0.42 * h}`} stroke={c('#1a1a1a')} strokeWidth={0.02 * h} fill="none" />
        </g>
      );
    case 'dosimeterPavel':
      return (
        <g transform={`translate(0,${0.1 * h})`}>
          <rect x={-0.17 * h} y={0} width={0.34 * h} height={0.48 * h} rx={0.05 * h} fill={c('#A88A2E')} />
          <rect x={-0.11 * h} y={0.07 * h} width={0.22 * h} height={0.13 * h} fill="#B9C64A" opacity={k.rim ? 0 : 0.9} />
        </g>
      );
    case 'bottle':
      return (
        <g transform={`translate(0,${0.05 * h})`} opacity={0.6}>
          <rect x={-0.12 * h} y={0} width={0.24 * h} height={0.7 * h} rx={0.06 * h} fill={c('#7C939B')} />
          <rect x={-0.05 * h} y={-0.08 * h} width={0.1 * h} height={0.1 * h} fill={c('#3d5a6a')} />
        </g>
      );
    case 'micro':
      return <rect x={-0.08 * h} y={0.08 * h} width={0.16 * h} height={0.28 * h} rx={0.04 * h} fill={c('#1a1a1a')} />;
    default:
      return null;
  }
};
