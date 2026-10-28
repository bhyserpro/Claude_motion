import React from 'react';
import {CharSpec, Pose, Rig, RigProps, Slots} from './Rig';
import {HeldItem, HeldItemKind} from './items';
import {Buzz} from './parts';

/** Корнеев, 45. Квадратный, почти без шеи, маленькая голова на широком торсе. */
export type KorneevProps = RigProps & {holdR?: HeldItemKind; holdL?: HeldItemKind; shout?: boolean};

const spec: CharSpec = {
  id: 'korneev',
  heightCm: 188,
  shoulders: 2.8,
  hips: 1.9,
  neckW: 0.78,
  headScale: 0.86,
  torsoShape: 'square',
  skin: '#B29F8B',
  skinShade: '#8c7a68',
  top: '#1C1F22',
  topShade: '#121416',
  topHi: '#2a2e32',
  coatLen: 0.35,
  coatFlare: 0.04,
  pants: '#1C1F22',
  pantsShade: '#141618',
  shoes: '#141414',
  armW: 0.44,
  legW: 0.5,
  face: {eyes: 'slit', brows: 10, mouth: 'tight', nose: true},
};

const slots = (p: KorneevProps): Slots => ({
  head: (k) => {
    const R = k.h / 2;
    const {c, view} = k;
    const els: React.ReactNode[] = [];
    els.push(<Buzz key="bz" k={k} color="#3A332D" />);
    // тяжёлая нижняя челюсть: круг подрезан прямоугольником
    if (view !== 'back') {
      const off = view === 'front' ? 0 : R * 0.12;
      els.push(<path key="jaw" d={`M${-R * 0.82 + off},${R * 0.35} L${R * 0.82 + off},${R * 0.35} L${R * 0.72 + off},${R * 0.98} L${-R * 0.72 + off},${R * 0.98} Z`} fill={c('#B29F8B')} />);
      els.push(<path key="jaw2" d={`M${R * 0.4 + off},${R * 0.35} L${R * 0.82 + off},${R * 0.35} L${R * 0.72 + off},${R * 0.98} L${R * 0.3 + off},${R * 0.98} Z`} fill={c('#8c7a68')} />);
    }
    return <g>{els}</g>;
  },
  torso: (k, g) => {
    const {c, h, view, lod} = k;
    const els: React.ReactNode[] = [];
    // ремень с пряжкой
    els.push(<rect key="belt" x={-g.W * 0.56} y={-0.12 * h} width={g.W * 1.12} height={0.12 * h} fill={c('#0e0f10')} />);
    if (view !== 'back') {
      els.push(<rect key="bk" x={-0.08 * h} y={-0.13 * h} width={0.16 * h} height={0.14 * h} fill={c('#5C5C58')} />);
      if (lod > 0) {
        els.push(<line key="zip" x1={0} y1={-g.T + 0.1 * h} x2={0} y2={-0.12 * h} stroke={c('#2c3034')} strokeWidth={0.03 * h} />);
        els.push(<path key="col" d={`M${-0.42 * h},${-g.T} L${0.42 * h},${-g.T} L${0.3 * h},${-g.T + 0.18 * h} L${-0.3 * h},${-g.T + 0.18 * h} Z`} fill={c('#2a2e32')} />);
      }
      // мёртвая рация на плече
      els.push(
        <g key="radio" transform={`translate(${g.S * 0.22},${-g.T + 0.08 * h})`}>
          <rect x={0} y={0} width={0.18 * h} height={0.3 * h} rx={0.02 * h} fill={c('#0c0d0e')} />
          <rect x={0.13 * h} y={-0.18 * h} width={0.025 * h} height={0.2 * h} fill={c('#0c0d0e')} />
        </g>,
      );
    }
    return <g>{els}</g>;
  },
  armR: (k, s) =>
    s === 'upper' ? (
      <g>
        <rect x={-0.16 * k.h} y={0.18 * k.h} width={0.32 * k.h} height={0.2 * k.h} fill={k.c('#3A3E42')} />
        {k.lod > 1 ? (
          <text x={0} y={0.31 * k.h} fontSize={0.065 * k.h} textAnchor="middle" fill={k.c('#9a9e9a')} fontFamily="PT Serif, serif">
            ОХРАНА
          </text>
        ) : null}
      </g>
    ) : null,
  handR: (k) => (p.holdR ? <HeldItem kind={p.holdR} k={k} /> : null),
  handL: (k) => (p.holdL ? <HeldItem kind={p.holdL} k={k} /> : null),
});

export const Korneev: React.FC<KorneevProps> = (props) => (
  <Rig
    {...props}
    face={props.shout ? {mouth: 'open', brows: 16, ...props.face} : props.face}
    spec={spec}
    slots={slots(props)}
    seed={props.seed ?? 'korneev'}
  />
);

export const KORNEEV_POSES: Record<string, Pose> = {
  stand_dominant: {armL: [18, 6], armR: [18, 6], legL: [6, 0], legR: [6, 0]},
  guard_water: {hipDrop: 1.75, legL: [70, 120], legR: [64, 116], lean: 24, armL: [40, 80], armR: [36, 84], sit: true},
  guard_water_front: {hipDrop: 1.35, thighScale: 0.3, legL: [14, 0], legR: [14, 0], armL: [14, 70], armR: [14, 70], sit: true},
  shout: {armL: [30, 30], armR: [40, 50]},
  panic_flashlight: {lean: -12, armL: [110, 10], armR: [40, 70], headTilt: -10},
};
