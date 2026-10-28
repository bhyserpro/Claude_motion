import React from 'react';
import {CharSpec, Pose, Rig, RigProps, Slots} from './Rig';
import {HeldItem, HeldItemKind} from './items';
import {viewOff} from './parts';

/** Нина Ведерникова, 36. Аккуратный вертикальный силуэт, пучок — круг над кругом головы. */
export type NinaProps = RigProps & {
  episode?: 1 | 2 | 3 | 4 | 5;
  holdR?: HeldItemKind;
  holdL?: HeldItemKind;
  gloves?: boolean;
  /** брови «домиком» на 3° (серия 4, «Кроме тебя») */
  softBrows?: boolean;
};

const ninaSpec = (ep: number, gloves: boolean): CharSpec => ({
  id: 'nina',
  heightCm: 165,
  shoulders: 2.0,
  hips: 1.45,
  slouch: 0,
  skin: '#C2B2A0',
  skinShade: '#9A8A79',
  top: '#7C746A',
  topShade: '#5B544C',
  topHi: '#8d867b',
  coatLen: 0.85,
  coatFlare: 0.14,
  pants: '#3E5B57',
  pantsShade: '#324a47',
  shoes: '#C9C6BE',
  sole: '#9e9b94',
  hand: gloves ? '#A7B6BC' : undefined,
  handShade: gloves ? '#8a9aa0' : undefined,
  armW: 0.32,
  legW: 0.38,
  face: {eyes: 'slit', brows: 0, mouth: 'line', nose: true},
});

const ninaSlots = (ep: number, p: NinaProps): Slots => ({
  headBack: (k) => {
    const R = k.h / 2;
    const off = k.view === 'front' || k.view === 'back' ? 0 : -R * 0.75;
    const oy = k.view === 'front' || k.view === 'back' ? -R * 0.92 : -R * 0.55;
    return <circle cx={off} cy={oy} r={k.h * 0.2} fill={k.c('#4A3A2E')} />;
  },
  head: (k) => {
    const R = k.h / 2;
    const {c, view, lod} = k;
    const els: React.ReactNode[] = [];
    const off = viewOff(view, R);
    if (view === 'back') {
      els.push(<path key="hb" d={`M${-R * 1.04},${R * 0.25} A${R * 1.04},${R * 1.04} 0 0 1 ${R * 1.04},${R * 0.25} Q0,${R * 0.55} ${-R * 1.04},${R * 0.25} Z`} fill={c('#4A3A2E')} />);
    } else {
      // гладкий «шлем» с пробором, волосы закрывают уши
      els.push(
        <path
          key="h"
          d={`M${-R * 1.05},${R * 0.3} A${R * 1.05},${R * 1.05} 0 0 1 ${R * 1.05},${R * 0.3} L${R * 0.86},${R * 0.3} Q${R * 0.85},${-R * 0.42} ${off + R * 0.1},${-R * 0.5} Q${-R * 0.85},${-R * 0.42} ${-R * 0.86},${R * 0.3} Z`}
          fill={c('#4A3A2E')}
        />,
      );
      if (lod > 1) els.push(<path key="sh" d={`M${-R * 0.6},${-R * 0.75} Q${-R * 0.1},${-R * 0.98} ${R * 0.35},${-R * 0.85}`} stroke={c('#6a5848')} strokeWidth={R * 0.06} fill="none" opacity={0.6} />);
      if (ep >= 4 && lod > 0) {
        els.push(<path key="s1" d={`M${-R * 0.5},${-R * 0.45} Q${-R * 0.62},${-R * 0.05} ${-R * 0.42},${R * 0.3}`} stroke={c('#4A3A2E')} strokeWidth={R * 0.035} fill="none" />);
        els.push(<path key="s2" d={`M${R * 0.55},${-R * 0.4} Q${R * 0.7},${R * 0.0} ${R * 0.6},${R * 0.35}`} stroke={c('#4A3A2E')} strokeWidth={R * 0.03} fill="none" />);
      }
      if (ep >= 5) {
        // лицо обмотано тканью — видны только глаза
        els.push(<path key="cl" d={`M${-R * 1.02},${R * 0.1} L${R * 1.02},${R * 0.1} A${R * 1.02},${R * 1.02} 0 0 1 ${-R * 1.02},${R * 0.1} Z`} fill={c('#6B6A64')} />);
        if (lod > 0) els.push(<path key="cl2" d={`M${-R * 0.95},${R * 0.38} Q0,${R * 0.5} ${R * 0.95},${R * 0.38}`} stroke={c('#55544f')} strokeWidth={R * 0.05} fill="none" />);
      }
    }
    return <g>{els}</g>;
  },
  torso: (k, g) => {
    const {c, h, view, lod} = k;
    const els: React.ReactNode[] = [];
    if (view === 'back') {
      els.push(<rect key="belt" x={-g.W * 0.62} y={-0.32 * h} width={g.W * 1.24} height={0.12 * h} fill={c('#6b6359')} />);
      return <g>{els}</g>;
    }
    const front = view === 'front';
    const cx = front ? 0 : g.S * 0.14;
    // V-вырез скраба и лацканы пальто
    els.push(<path key="v" d={`M${cx - 0.26 * h},${-g.T} L${cx + 0.26 * h},${-g.T} L${cx},${-g.T + 0.62 * h} Z`} fill={c('#3E5B57')} />);
    els.push(<path key="vn" d={`M${cx - 0.13 * h},${-g.T} L${cx + 0.13 * h},${-g.T} L${cx},${-g.T + 0.25 * h} Z`} fill={c('#9A8A79')} />);
    if (lod > 0) {
      els.push(<path key="l1" d={`M${cx - 0.28 * h},${-g.T - 0.02 * h} L${cx - 0.04 * h},${-g.T + 0.68 * h} L${cx - 0.42 * h},${-g.T + 0.35 * h} Z`} fill={c('#8d867b')} />);
      els.push(<path key="l2" d={`M${cx + 0.28 * h},${-g.T - 0.02 * h} L${cx + 0.04 * h},${-g.T + 0.68 * h} L${cx + 0.42 * h},${-g.T + 0.35 * h} Z`} fill={c('#6d665d')} />);
    }
    // пояс завязан
    els.push(<rect key="belt" x={-g.W * 0.62} y={-0.34 * h} width={g.W * 1.24} height={0.12 * h} fill={c('#6b6359')} />);
    if (lod > 0) {
      els.push(<path key="knot" d={`M${cx + 0.05 * h},${-0.3 * h} l${0.08 * h},${0.35 * h} l${0.07 * h},${-0.02 * h} l${-0.05 * h},${-0.33 * h} Z`} fill={c('#6b6359')} />);
    }
    // бейдж слева на груди (левая сторона персонажа = справа на экране анфас)
    const bx = front ? g.S * 0.17 : g.S * 0.26;
    els.push(
      <g key="badge" transform={`translate(${bx},${-g.T * 0.66})`}>
        <rect x={0} y={0} width={0.3 * h} height={0.2 * h} fill={c('#D8D4CB')} />
        <rect x={0} y={0} width={0.3 * h} height={0.04 * h} fill={c('#7A1712')} />
        {lod > 1 ? (
          <>
            <rect x={0.02 * h} y={0.06 * h} width={0.08 * h} height={0.1 * h} fill={c('#8a8578')} />
            <text x={0.115 * h} y={0.11 * h} fontSize={0.035 * h} fill={c('#2a2a2a')} fontFamily="PT Serif, serif">
              Рентгенология
            </text>
            <rect x={0.115 * h} y={0.13 * h} width={0.15 * h} height={0.012 * h} fill={c('#6a665e')} />
          </>
        ) : null}
      </g>,
    );
    // ремень тканевой сумки
    if (lod > 0) els.push(<path key="str" d={`M${-g.S * 0.32},${-g.T + 0.02 * h} L${-g.S * 0.26},${-g.T} L${-g.W * 0.45},${-0.1 * h} L${-g.W * 0.52},${-0.08 * h} Z`} fill={c('#4a4f48')} />);
    return <g>{els}</g>;
  },
  skirt: (k, g) => {
    const {c, h, view} = k;
    if (view === 'back') return null;
    const bx = view === 'front' ? -g.W * 0.98 : -g.W * 0.8;
    return <rect x={bx} y={-0.05 * h} width={0.55 * h} height={0.62 * h} rx={0.1 * h} fill={c('#5A5F57')} />;
  },
  armR: (k, segm) =>
    ep >= 4 && segm === 'lower' ? <ellipse cx={0} cy={0.45 * k.h} rx={0.1 * k.h} ry={0.07 * k.h} fill={k.c('#4a1410')} opacity={0.8} /> : null,
  leg: (k, segm) =>
    ep >= 2 && segm === 'foot' ? <ellipse cx={0.05 * k.h} cy={-0.06 * k.h} rx={0.08 * k.h} ry={0.04 * k.h} fill={k.c('#6a6458')} opacity={0.7} /> : null,
  handR: (k) => (p.holdR ? <HeldItem kind={p.holdR} k={k} /> : null),
  handL: (k) => (p.holdL ? <HeldItem kind={p.holdL} k={k} /> : null),
});

export const Nina: React.FC<NinaProps> = (props) => {
  const ep = props.episode ?? 1;
  const face = {
    ...(ep >= 5 ? {mouth: 'none' as const, nose: false} : {}),
    ...(props.softBrows ? {brows: -3} : {}),
    ...props.face,
  };
  return <Rig {...props} face={face} spec={ninaSpec(ep, !!props.gloves)} slots={ninaSlots(ep, props)} seed={props.seed ?? 'nina'} />;
};

export const NINA_POSES: Record<string, Pose> = {
  stand_idle: {armL: [-8, 115], armR: [-8, 115], handL: 'fist'},
  measure: {armL: [-5, 110], armR: [80, 5]},
  measureFront: {armL: [-8, 115], armR: [40, -30]},
  kneel_care: {hipDrop: 1.1, legL: [80, 95], legR: [-10, 100], lean: 25, armL: [50, 30], armR: [40, 40]},
  sit_straight: {hipDrop: 1.42, legL: [88, 88], legR: [84, 86], armL: [20, 70], armR: [16, 75], sit: true},
  sitFront: {hipDrop: 1.0, thighScale: 0.3, legL: [3, 0], legR: [3, 0], armL: [-6, 100], armR: [-6, 100], sit: true},
  write_list: {armL: [25, 100], armR: [22, 105], headPitch: 0.6},
  confront: {armL: [3, 2], armR: [3, 2]},
};
