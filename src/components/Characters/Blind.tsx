import React from 'react';
import {random} from 'remotion';
import {desaturate, mix} from '../../lib/color';
import {pick, rnd} from '../../lib/noise';
import {CharSpec, Pose, Rig, RigProps, Slots, walkPose} from './Rig';
import {Burns, LongHand, SkinStrips} from './parts';

/**
 * «Засвеченные» — параметрический компонент. Из одного рига по seed получается толпа.
 * Вид A — сидят у стен, B — слушают стоя, C — идут, вытянув руки.
 * headYaw — синхронный поворот головы (−1..1), задаётся сценой одинаково для всех.
 */
export type BlindKind = 'A' | 'B' | 'C';
export type BlindProps = RigProps & {
  kind?: BlindKind;
  walkT?: number; // фаза шага для вида C
  headYaw?: number;
  gravel?: boolean;
  reachHand?: boolean; // крупная кисть с пальцами вместо «варежки»
};

const CLOTHES = [
  {name: 'пиджак', top: '#4b4d50', len: 0.45, flare: 0.05},
  {name: 'куртка', top: '#4f5248', len: 0.3, flare: 0.05},
  {name: 'халат', top: '#6c6a64', len: 1.6, flare: 0.25},
  {name: 'спортивная кофта', top: '#45494d', len: 0.2, flare: 0.02},
  {name: 'комбинезон', top: '#555649', len: 0.0, flare: 0},
  {name: 'платье с кофтой', top: '#5c5753', len: 1.5, flare: 0.35},
];
const SKINS = ['#C9C2B4', '#D6CFC2', '#E3DDD2'];

export const blindSpec = (seed: string): CharSpec => {
  const cl = CLOTHES[Math.floor(random(`${seed}-cl`) * CLOTHES.length)];
  const wash = (c: string) => mix(desaturate(c, 0.9), '#8D8F8A', 0.35);
  const skin = pick(`${seed}-sk`, SKINS);
  return {
    id: 'blind',
    heightCm: rnd(`${seed}-h`, 155, 190),
    shoulders: rnd(`${seed}-s`, 1.95, 2.45),
    hips: rnd(`${seed}-hp`, 1.35, 1.65),
    skin,
    skinShade: '#8C8E8C',
    top: wash(cl.top),
    topShade: mix(wash(cl.top), '#000000', 0.25),
    coatLen: cl.len,
    coatFlare: cl.flare,
    pants: wash(cl.name === 'комбинезон' ? cl.top : cl.name === 'платье с кофтой' ? '#6d6964' : '#3e3f3d'),
    shoes: '#4A4440',
    barefoot: true,
    hand: skin,
    handShade: '#8C8E8C',
    still: true,
    armW: 0.33,
    legW: 0.4,
    face: {eyes: 'white', brows: null, mouth: 'none', nose: false},
  };
};

const slots = (seed: string, p: BlindProps, spec: CharSpec): Slots => {
  const nStrips = 3 + Math.floor(random(`${seed}-ns`) * 6);
  const tufts = Math.floor(random(`${seed}-tf`) * 3);
  const acc = Math.floor(random(`${seed}-acc`) * 5); // 0 нет, 1 очки без стёкол, 2 сумка, 3 бейдж, 4 наушники
  const moving = p.kind === 'C' ? 1 : 0;
  return {
    head: (k) => {
      const R = k.h / 2;
      const els: React.ReactNode[] = [];
      for (let i = 0; i < tufts; i++) {
        const a = -Math.PI * (0.25 + random(`${seed}-ta${i}`) * 0.5);
        els.push(
          <path
            key={`t${i}`}
            d={`M${Math.cos(a) * R},${Math.sin(a) * R} l${R * 0.12},${-R * 0.22} l${R * 0.06},${R * 0.25} Z`}
            fill={k.c('#2a2624')}
          />,
        );
      }
      if (k.lod > 0) els.push(<Burns key="b" k={k} seed={`${seed}-hb`} n={k.lod > 1 ? 4 : 2} area={[-R * 0.8, -R * 0.8, R * 1.4, R * 1.2]} />);
      if (k.lod > 0) els.push(<SkinStrips key="s" k={k} seed={`${seed}-hs`} n={Math.min(3, nStrips - 2)} area={[-R * 0.6, R * 0.0, R * 1.2, R * 0.5]} len={0.26} sway={moving} />);
      if (acc === 1 && k.view !== 'back') {
        els.push(
          <g key="gl" fill="none" stroke={k.c('#2a2a28')} strokeWidth={R * 0.04}>
            <circle cx={-R * 0.3} cy={0} r={R * 0.2} />
            <circle cx={R * 0.3} cy={0} r={R * 0.2} />
          </g>,
        );
      }
      return <g>{els}</g>;
    },
    torso: (k, g) => {
      const {h} = k;
      const els: React.ReactNode[] = [];
      if (k.lod > 0) els.push(<SkinStrips key="ns" k={k} seed={`${seed}-ns`} n={2} area={[-0.2 * h, -g.T - 0.1 * h, 0.4 * h, 0.1 * h]} len={0.3} sway={moving} />);
      if (k.lod > 0) els.push(<Burns key="tb" k={k} seed={`${seed}-tb`} n={2} area={[-g.S * 0.4, -g.T * 0.9, g.S * 0.8, g.T * 0.7]} />);
      if (acc === 2) els.push(<path key="bag" d={`M${g.S * 0.4},${-g.T} L${-g.W * 0.5},${-0.05 * h}`} stroke={k.c('#3a3936')} strokeWidth={0.06 * h} />);
      if (acc === 3) els.push(<rect key="badge" x={g.S * 0.15} y={-g.T * 0.65} width={0.24 * h} height={0.16 * h} fill={k.c('#9a9890')} />);
      if (acc === 4) els.push(<path key="hp" d={`M${-0.35 * h},${-g.T - 0.05 * h} Q0,${-g.T + 0.25 * h} ${0.35 * h},${-g.T - 0.05 * h}`} stroke={k.c('#1e1f20')} strokeWidth={0.07 * h} fill="none" />);
      return <g>{els}</g>;
    },
    armL: (k, s) =>
      s === 'lower' && k.lod > 0 ? <SkinStrips k={k} seed={`${seed}-al`} n={2} area={[-0.1 * k.h, 0.2 * k.h, 0.2 * k.h, 0.5 * k.h]} len={0.35} sway={moving} /> : null,
    armR: (k, s) =>
      s === 'lower' && k.lod > 0 ? <SkinStrips k={k} seed={`${seed}-ar`} n={Math.max(1, nStrips - 5)} area={[-0.1 * k.h, 0.2 * k.h, 0.2 * k.h, 0.5 * k.h]} len={0.35} sway={moving} /> : null,
    handL: (k) =>
      p.reachHand ? <LongHand c={k.c} len={0.6 * k.h} skin={spec.skin} shade="#8C8E8C" nails="#2a201e" pose="reach" strips seed={`${seed}-lh`} /> : null,
  };
};

export const Blind: React.FC<BlindProps> = (props) => {
  const seed = props.seed ?? 'b0';
  const kind = props.kind ?? 'B';
  const spec = blindSpec(seed);
  if (kind === 'A') spec.coatLen = Math.min(spec.coatLen ?? 0, 0.25);
  const tilt = rnd(`${seed}-tilt`, 15, 25) * (random(`${seed}-td`) < 0.5 ? -1 : 1);
  let pose: Pose;
  if (kind === 'A') {
    // сидят у стены: колени к груди, голова на боку
    pose = {
      hipDrop: 2.62,
      legL: [128, 150],
      legR: [122, 146],
      armL: [42, 30],
      armR: [36, 34],
      lean: 22,
      headTilt: rnd(`${seed}-at`, 18, 32) * (random(`${seed}-ad`) < 0.5 ? -1 : 1),
      sit: true,
    };
  } else if (kind === 'C') {
    pose = walkPose(props.walkT ?? 0, 0.6, {armL: [80, -6], armR: [74, -2]});
    pose.armL = [78 + Math.sin((props.walkT ?? 0) * 6.28) * 3, -8];
    pose.armR = [72 - Math.sin((props.walkT ?? 0) * 6.28) * 3, -4];
    pose.handL = 'open';
    pose.handR = 'open';
    pose.headTilt = tilt * 0.4;
  } else {
    pose = {armL: [9, -4], armR: [9, -4], handL: 'open', handR: 'open', headTilt: tilt};
  }
  pose.headYaw = props.headYaw ?? pose.headYaw ?? 0;
  if (props.reachHand) pose.handL = 'hidden';
  const face = props.gravel || random(`${seed}-gr`) < 0.18 ? {mouth: 'gravel' as const} : undefined;
  const view = props.view ?? (kind === 'A' || kind === 'C' ? 'three_quarter' : 'front');
  return (
    <Rig
      ash={props.ash ?? rnd(`${seed}-ash`, 0.8, 1)}
      {...props}
      view={view}
      pose={{...pose, ...props.pose}}
      face={{...face, ...props.face}}
      breathe={false}
      spec={spec}
      slots={slots(seed, {...props, kind}, spec)}
      seed={seed}
    />
  );
};
