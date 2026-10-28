import React from 'react';
import {random} from 'remotion';
import {CharSpec, Pose, Rig, RigProps, Slots} from './Rig';
import {LongHand, Shine, SkinStrips} from './parts';

/**
 * «Пятнадцатый». Очень длинное пальто-колокол, голова ушла в плечи.
 * Абсолютная неподвижность: дыхания нет. Единственное движение — «палец к губам» (fingerToLips 0..1).
 */
export type CoatFigureProps = RigProps & {
  headUp?: boolean; // с серии 3 видны белые глаза
  fingerToLips?: number; // 0..1, подъём руки (в сцене — за 40 кадров)
  drips?: boolean;
  puddle?: boolean;
};

const spec = (headUp: boolean): CharSpec => ({
  id: 'coat',
  heightCm: 196,
  shoulders: 1.9,
  hips: 1.55,
  neckW: 0.4,
  torsoShape: 'bell',
  skin: headUp ? '#C9C2B4' : '#A39C90',
  skinShade: headUp ? '#8C8E8C' : '#7c766c',
  top: '#1A1D1C',
  topShade: '#0E100F',
  coatLen: 2.85,
  coatFlare: 0.8,
  pants: '#0E100F',
  shoes: '#0a0b0b',
  hand: '#C9C2B4',
  handShade: '#8C8E8C',
  armW: 0.38,
  still: true,
  face: headUp ? {eyes: 'white', brows: null, mouth: 'none', nose: false} : {eyes: 'none', brows: null, mouth: 'none', nose: false},
});

const wet = (k: {light: string; c: (s: string) => string; rim: boolean}) =>
  k.rim ? k.c('#3A4442') : k.light === 'emergency' ? '#5a2420' : k.light === 'flashlight' ? '#7f8c8c' : k.c('#3A4442');

const slots = (p: CoatFigureProps): Slots => ({
  head: (k) => {
    const R = k.h / 2;
    return (
      <g>
        <Shine k={k} color={k.light === 'emergency' ? '#c04030' : '#dfe8e8'} opacity={0.35} />
        <path d={`M${-R * 0.8},${-R * 0.55} Q${-R * 0.2},${-R * 0.95} ${R * 0.5},${-R * 0.8}`} stroke={wet(k)} strokeWidth={R * 0.06} fill="none" opacity={0.6} />
        {p.headUp && k.lod > 0 ? <SkinStrips k={k} seed="coat-face" n={3} area={[R * 0.2, R * 0.1, R * 0.6, R * 0.5]} len={0.28} /> : null}
      </g>
    );
  },
  torso: (k, g) => {
    const {h} = k;
    // 4–6 мокрых вертикальных бликов-полос
    const xs = [-0.32, -0.12, 0.08, 0.26, 0.4];
    return (
      <g opacity={0.5}>
        {xs.map((x, i) => (
          <rect key={i} x={x * g.S} y={-g.T + 0.2 * h + i * 0.05 * h} width={0.035 * h} height={g.T * (0.6 + (i % 2) * 0.2)} rx={0.015 * h} fill={wet(k)} />
        ))}
        {p.headUp && k.lod > 0 ? <SkinStrips k={k} seed="coat-neck" n={2} area={[-0.1 * h, -g.T - 0.05 * h, 0.2 * h, 0.05 * h]} len={0.3} /> : null}
      </g>
    );
  },
  skirt: (k, g) => {
    const {h, frame} = k;
    const L = 2.85 * h;
    const xs = [-0.55, -0.25, 0.05, 0.3, 0.6, 0.78];
    const els: React.ReactNode[] = xs.map((x, i) => (
      <rect key={i} x={x * (g.W / 2 + 0.8 * h) - 0.02 * h} y={0.3 * h + i * 0.08 * h} width={0.04 * h} height={L * (0.55 + (i % 3) * 0.12)} rx={0.02 * h} fill={wet(k)} opacity={0.5} />
    ));
    // капли с подола каждые 20–40 кадров
    if (p.drips !== false && !k.rim) {
      for (let j = 0; j < 3; j++) {
        const period = 20 + Math.floor(random(`drip-p${j}`) * 20);
        const t = (frame + j * 13) % period;
        const cycle = Math.floor((frame + j * 13) / period);
        const fall = 10;
        if (t < fall) {
          const x = (random(`drip-x${j}-${cycle}`) - 0.5) * (g.W + 1.4 * h);
          const y = L + (t / fall) * (3 * h - L + 0.0);
          els.push(<ellipse key={`d${j}`} cx={x} cy={y} rx={0.018 * h} ry={0.04 * h} fill={wet(k)} opacity={0.9} />);
        }
      }
    }
    return <g>{els}</g>;
  },
  // высокий поднятый воротник закрывает нижнюю половину головы: «голова ушла в плечи»
  over: (k, g) => {
    const {h, c} = k;
    const y0 = -g.T;
    const dip = (p.headUp ? 0.42 : 0.25) * h;
    return (
      <path
        d={`M${-0.8 * h},${y0 + 0.3 * h} Q${-0.74 * h},${y0 - 0.42 * h} ${-0.38 * h},${y0 - 0.5 * h} Q0,${y0 + dip} ${0.38 * h},${y0 - 0.5 * h} Q${0.74 * h},${y0 - 0.42 * h} ${0.8 * h},${y0 + 0.3 * h} Z`}
        fill={c('#161918')}
      />
    );
  },
  handL: (k) =>
    (p.fingerToLips ?? 0) > 0.01 ? (
      <g transform={`translate(0,${-0.02 * k.h})`}>
        <LongHand c={k.c} len={0.62 * k.h} skin="#C9C2B4" shade="#8C8E8C" nails="#2a201e" pose="point_up" strips />
      </g>
    ) : null,
});

export const CoatFigure: React.FC<CoatFigureProps> = (props) => {
  const f = props.fingerToLips ?? 0;
  const base = props.pose ?? {};
  // рука поднимается из рукава к губам
  const lerp = (a: number, b: number) => a + (b - a) * f;
  const pose: Pose = {
    headDrop: props.headUp ? 0.34 : 0.62,
    headPitch: props.headUp ? -0.1 : 0.4,
    handL: f > 0.01 ? 'hidden' : 'hidden',
    handR: 'hidden',
    armL: [4, 4],
    armR: [4, 4],
    legL: [0, 0],
    legR: [0, 0],
    ...base,
  };
  if (f > 0.001) {
    const front = (props.view ?? 'front') === 'front';
    pose.armL = front ? [lerp(base.armL?.[0] ?? 4, -40), lerp(base.armL?.[1] ?? 4, 140)] : [lerp(base.armL?.[0] ?? 4, 30), lerp(base.armL?.[1] ?? 4, 150)];
  }
  const s = props.scale ?? 1;
  const Hgt = (196 / 180) * 1000;
  return (
    <g>
      {props.puddle !== false ? (
        <ellipse
          cx={props.x ?? 0}
          cy={(props.y ?? 0) + (base.hipDrop ? 0 : 0)}
          rx={Hgt * 0.24 * s}
          ry={Hgt * 0.035 * s}
          fill="#050606"
          opacity={props.opacity ?? 1}
        />
      ) : null}
      <Rig {...props} pose={pose} breathe={false} spec={spec(!!props.headUp)} slots={slots(props)} seed="coat" />
    </g>
  );
};

export const COAT_POSES: Record<string, Pose> = {
  stand_far: {},
  sit_head_down: {hipDrop: 1.05, thighScale: 0.3, legL: [3, 0], legR: [3, 0], armL: [-4, 30], armR: [-4, 30], sit: true},
  sit_head_down_side: {hipDrop: 1.5, legL: [84, 86], legR: [80, 86], armL: [20, 45], armR: [16, 50], sit: true},
  sit_beside: {hipDrop: 1.5, legL: [84, 86], legR: [80, 86], armL: [20, 45], armR: [16, 50], headYaw: -0.3, sit: true},
};
