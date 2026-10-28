import React from 'react';
import {CharSpec, Pose, Rig, RigProps, Slots} from './Rig';
import {HeldItem, HeldItemKind} from './items';
import {Glasses, viewOff} from './parts';

/** Семён Аркадьевич, 68. Сильная сутулость, кепка, светоотражающие полосы. */
export type SemyonProps = RigProps & {holdR?: HeldItemKind; holdL?: HeldItemKind; noGlasses?: boolean; deadFace?: boolean};

const spec: CharSpec = {
  id: 'semyon',
  heightCm: 170,
  shoulders: 2.2,
  hips: 1.5,
  slouch: 12,
  headForward: 0.32,
  skin: '#B09C88',
  skinShade: '#8a7866',
  top: '#7A4B2E',
  topShade: '#5C3822',
  topHi: '#8a5a3a',
  coatLen: 0.3,
  coatFlare: 0.05,
  pants: '#33332E',
  shoes: '#1E1C19',
  face: {eyes: 'dots', brows: 4, mouth: 'none', nose: true, blush: '#A07E6E'},
};

const stripe = (k: {light: string; c: (s: string) => string; rim: boolean}) =>
  k.rim ? k.c('#8D8D86') : k.light === 'flashlight' ? '#E6E8E2' : k.light === 'emergency' ? '#8a3a30' : k.c('#8D8D86');

const slots = (p: SemyonProps): Slots => ({
  head: (k) => {
    const R = k.h / 2;
    const {c, view, lod} = k;
    const off = viewOff(view, R);
    const els: React.ReactNode[] = [];
    // седые клинья из-под кепки
    els.push(<path key="g1" d={`M${-R * 1.02},${-R * 0.1} L${-R * 0.75},${-R * 0.3} L${-R * 0.85},${R * 0.25} Z`} fill={c('#A9A6A0')} />);
    if (view !== 'profile') els.push(<path key="g2" d={`M${R * 1.02},${-R * 0.1} L${R * 0.75},${-R * 0.3} L${R * 0.85},${R * 0.25} Z`} fill={c('#A9A6A0')} />);
    // кепка-восьмиклинка
    els.push(<path key="cap" d={`M${-R * 1.08},${-R * 0.18} Q${-R * 1.0},${-R * 1.22} ${R * 0.1},${-R * 1.12} Q${R * 1.12},${-R * 1.0} ${R * 1.08},${-R * 0.18} Z`} fill={c('#3B3A35')} />);
    if (view !== 'back') {
      const vx = view === 'front' ? 0 : R * 0.55;
      els.push(<ellipse key="visor" cx={vx - off * 0.5} cy={-R * 0.2} rx={view === 'front' ? R * 0.85 : R * 0.7} ry={R * 0.13} fill={c('#2b2a26')} />);
      if (!p.noGlasses) els.push(<Glasses key="gl" k={k} glint={k.light === 'flashlight'} />);
      // густые седые усы — закрывают рот
      const mx = -off * 2.2;
      els.push(<path key="mu" d={`M${mx - R * 0.36},${R * 0.5} Q${mx},${R * 0.18} ${mx + R * 0.36},${R * 0.5} Q${mx},${R * 0.38} ${mx - R * 0.36},${R * 0.5} Z`} fill={c('#B8B5AF')} />);
      if (lod > 1) els.push(<rect key="mu2" x={mx - R * 0.22} y={R * 0.3} width={R * 0.44} height={R * 0.08} fill={c('#d0cdc6')} opacity={0.5} />);
    }
    return <g>{els}</g>;
  },
  torso: (k, g) => {
    const {c, h, view, lod} = k;
    const els: React.ReactNode[] = [];
    if (view !== 'back') {
      const cx = view === 'front' ? 0 : g.S * 0.15;
      // свитер в вороте, вязка — 3 линии
      els.push(<path key="sw" d={`M${cx - 0.3 * h},${-g.T} L${cx + 0.3 * h},${-g.T} L${cx + 0.2 * h},${-g.T + 0.38 * h} L${cx - 0.2 * h},${-g.T + 0.38 * h} Z`} fill={c('#4B463F')} />);
      if (lod > 0)
        [0.08, 0.15, 0.22].forEach((t, i) => els.push(<rect key={`k${i}`} x={cx - 0.24 * h} y={-g.T + t * h} width={0.48 * h} height={0.025 * h} fill={c('#3a3631')} />));
      if (lod > 0) els.push(<line key="zip" x1={cx} y1={-g.T + 0.38 * h} x2={cx} y2={0} stroke={c('#5C3822')} strokeWidth={0.035 * h} />);
    }
    // светоотражающая полоса на груди/спине
    els.push(<rect key="st" x={-g.S * 0.48} y={-g.T * 0.48} width={g.S * 0.96} height={0.11 * h} fill={stripe(k)} />);
    // связка ключей на поясе
    if (lod > 0 && view !== 'back') {
      els.push(
        <g key="keys" transform={`translate(${-g.W * 0.3},${-0.02 * h})`}>
          <circle cx={0} cy={0} r={0.05 * h} fill="none" stroke={c('#8C8A84')} strokeWidth={0.015 * h} />
          <rect x={-0.02 * h} y={0.04 * h} width={0.025 * h} height={0.14 * h} fill={c('#8C8A84')} transform="rotate(12)" />
          <rect x={0.01 * h} y={0.04 * h} width={0.025 * h} height={0.12 * h} fill={c('#8C8A84')} transform="rotate(-18)" />
        </g>,
      );
    }
    return <g>{els}</g>;
  },
  armL: (k, s) => (s === 'lower' ? <rect x={-0.19 * k.h} y={0.45 * k.h} width={0.38 * k.h} height={0.1 * k.h} fill={stripe(k)} /> : null),
  armR: (k, s) => (s === 'lower' ? <rect x={-0.19 * k.h} y={0.45 * k.h} width={0.38 * k.h} height={0.1 * k.h} fill={stripe(k)} /> : null),
  handR: (k) => (p.holdR ? <HeldItem kind={p.holdR} k={k} /> : null),
  handL: (k) => (p.holdL ? <HeldItem kind={p.holdL} k={k} /> : null),
});

export const Semyon: React.FC<SemyonProps> = (props) => (
  <Rig
    {...props}
    face={props.deadFace ? {eyes: 'closed', brows: 0, ...props.face} : props.face}
    spec={spec}
    slots={slots(props)}
    seed={props.seed ?? 'semyon'}
  />
);

export const SEMYON_POSES: Record<string, Pose> = {
  walk_tunnel: {armL: [20, 30], armR: [6, 10]},
  point: {armL: [75, 10], armR: [6, 10], handL: 'point'},
  sit_cab: {hipDrop: 1.45, legL: [84, 84], legR: [80, 86], armL: [24, 52], armR: [20, 56], sit: true},
  tap_wall: {armL: [70, 40], armR: [6, 10]},
  // лёжа на спине, руки сложены на груди — фигура поворачивается сценой на 90°
  dead_folded: {armL: [40, 140], armR: [36, 145], headTilt: 0},
};
