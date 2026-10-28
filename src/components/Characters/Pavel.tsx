import React from 'react';
import {CharSpec, Pose, Rig, RigProps, Slots} from './Rig';
import {HeldItem, HeldItemKind} from './items';
import {Backpack, HairCap} from './parts';

/** Павел, 30, машинист. Форменная куртка, сигнальный жилет, рюкзак. */
export type PavelProps = RigProps & {holdR?: HeldItemKind; holdL?: HeldItemKind; dead?: boolean};

const spec = (dead: boolean): CharSpec => ({
  id: 'pavel',
  heightCm: 178,
  shoulders: 2.3,
  hips: 1.5,
  skin: dead ? '#ABA394' : '#BFAE9A',
  skinShade: dead ? '#857e72' : '#97877a',
  top: '#1F2A3A',
  topShade: '#151D29',
  topHi: '#2a3850',
  coatLen: 0.3,
  coatFlare: 0.05,
  pants: '#1A2230',
  shoes: '#121418',
  face: dead ? {eyes: 'dead', brows: null, mouth: 'gravel', nose: false} : {eyes: 'oval', brows: 0, mouth: 'line', nose: true},
});

const stripe = (k: {light: string; c: (s: string) => string; rim: boolean}) =>
  k.rim ? k.c('#8D8D86') : k.light === 'flashlight' ? '#E6E8E2' : k.c('#8D8D86');

const slots = (p: PavelProps): Slots => ({
  behind: (k) => <Backpack k={k} color="#2a2f2a" w={1.1 * k.h} hgt={1.25 * k.h} />,
  head: (k) => <HairCap k={k} color="#5A4936" line={-0.42} sideDepth={-0.05} />,
  torso: (k, g) => {
    const {c, h, view, lod} = k;
    const els: React.ReactNode[] = [];
    // сигнальный жилет
    const vw = g.S * 0.42;
    if (view === 'back') {
      els.push(<path key="vest" d={`M${-vw},${-g.T + 0.05 * h} L${vw},${-g.T + 0.05 * h} L${g.W * 0.55},${-0.05 * h} L${-g.W * 0.55},${-0.05 * h} Z`} fill={c('#9A5A2C')} />);
    } else {
      els.push(<path key="vl" d={`M${-vw},${-g.T + 0.05 * h} L${-0.16 * h},${-g.T + 0.05 * h} L${-0.05 * h},${-0.05 * h} L${-g.W * 0.55},${-0.05 * h} Z`} fill={c('#9A5A2C')} />);
      els.push(<path key="vr" d={`M${vw},${-g.T + 0.05 * h} L${0.16 * h},${-g.T + 0.05 * h} L${0.05 * h},${-0.05 * h} L${g.W * 0.55},${-0.05 * h} Z`} fill={c('#8a5027')} />);
      // вымышленная эмблема: круг с горизонтальной линией (рельс)
      if (lod > 0) {
        els.push(
          <g key="emb" transform={`translate(${-g.S * 0.22},${-g.T * 0.7})`}>
            <circle r={0.08 * h} fill={c('#8C8A84')} />
            <rect x={-0.06 * h} y={-0.012 * h} width={0.12 * h} height={0.024 * h} fill={c('#1F2A3A')} />
          </g>,
        );
      }
    }
    // две светоотражающие полосы
    [0.55, 0.32].forEach((t, i) => els.push(<rect key={`st${i}`} x={-g.S * 0.42} y={-g.T * t} width={g.S * 0.84} height={0.07 * h} fill={stripe(k)} />));
    // лямки рюкзака
    if (view === 'front' && lod > 0) {
      els.push(<rect key="ls" x={-g.S * 0.36} y={-g.T} width={0.09 * h} height={g.T * 0.7} fill={c('#202420')} />);
      els.push(<rect key="rs" x={g.S * 0.36 - 0.09 * h} y={-g.T} width={0.09 * h} height={g.T * 0.7} fill={c('#202420')} />);
    }
    return <g>{els}</g>;
  },
  handR: (k) => {
    if (p.dead) {
      return (
        <g>
          {[-1, 0, 1].map((i) => (
            <rect key={i} x={i * 0.08 * k.h - 0.03 * k.h} y={0.32 * k.h} width={0.06 * k.h} height={0.06 * k.h} fill={k.c('#3A1A16')} />
          ))}
        </g>
      );
    }
    return p.holdR ? <HeldItem kind={p.holdR} k={k} /> : null;
  },
  handL: (k) => {
    if (p.dead) {
      return (
        <g>
          {[-1, 0, 1].map((i) => (
            <rect key={i} x={i * 0.08 * k.h - 0.03 * k.h} y={0.32 * k.h} width={0.06 * k.h} height={0.06 * k.h} fill={k.c('#3A1A16')} />
          ))}
        </g>
      );
    }
    return p.holdL ? <HeldItem kind={p.holdL} k={k} /> : null;
  },
});

export const Pavel: React.FC<PavelProps> = (props) => (
  <Rig {...props} breathe={props.dead ? false : props.breathe} spec={spec(!!props.dead)} slots={slots(props)} seed={props.seed ?? 'pavel'} />
);

export const PAVEL_POSES: Record<string, Pose> = {
  cab_intercom: {armL: [60, 70], armR: [6, 10], headTilt: -4},
  walk_away: {armL: [40, 20], armR: [10, 10]},
  // сидит, привалившись к стене, голова к двери, ладони вверх на коленях
  dead_sitting: {hipDrop: 2.55, legL: [92, 40], legR: [80, 30], lean: -16, headTilt: -22, headPitch: 0.1, armL: [30, 40], armR: [24, 38], handL: 'open', handR: 'open', sit: true},
  dead_sitting_front: {hipDrop: 2.3, thighScale: 0.25, legL: [22, 0], legR: [22, 0], headTilt: -20, armL: [24, 60], armR: [24, 60], handL: 'open', handR: 'open', sit: true},
};
