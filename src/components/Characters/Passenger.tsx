import React from 'react';
import {random} from 'remotion';
import {mix} from '../../lib/color';
import {rnd} from '../../lib/noise';
import {CharSpec, Pose, POSES, Rig, RigProps, Slots} from './Rig';
import {Backpack, HairCap, viewOff} from './parts';

/**
 * Фоновый пассажир. Именованные: Ольга и Ахмед; остальные 7 — по seed из набора типов.
 * dirt 0..1 — с каждой серией одежда грязнее и темнее.
 */
export type PassengerType = 'olga' | 'akhmed' | 'office' | 'student' | 'oldman' | 'puffer' | 'worker' | 'teen' | 'business';
export const PASSENGER_TYPES: PassengerType[] = ['office', 'student', 'oldman', 'puffer', 'worker', 'teen', 'business'];

export type PassengerProps = RigProps & {type?: PassengerType; dirt?: number; coatOff?: boolean; cry?: boolean};

type Def = {spec: Omit<CharSpec, 'id'>; slots: (seed: string) => Slots};

const hairColor = (seed: string) => ['#2b2622', '#3d3128', '#5a4936', '#1e1b19', '#6b665f'][Math.floor(random(`${seed}-hc`) * 5)];

const DEFS: Record<PassengerType, Def> = {
  olga: {
    spec: {heightCm: 160, shoulders: 2.4, hips: 2.0, skin: '#C0AC98', skinShade: '#988572', top: '#4E4A52', topShade: '#3b3840', topHi: '#5e5a62', coatLen: 1.3, coatFlare: 0.25, pants: '#2d2b30', shoes: '#1d1b1c', face: {eyes: 'slit', brows: -6, mouth: 'line'}},
    slots: () => ({
      head: (k) => {
        const R = k.h / 2;
        return (
          <g>
            <path d={`M${-R * 1.06},${-R * 0.05} Q${-R * 1.05},${-R * 1.25} 0,${-R * 1.18} Q${R * 1.05},${-R * 1.25} ${R * 1.06},${-R * 0.05} Z`} fill={k.c('#6B4A4A')} />
            {k.lod > 0 ? [0, 1, 2, 3].map((i) => <rect key={i} x={-R * 0.9 + i * R * 0.5} y={-R * 0.6} width={R * 0.06} height={R * 0.5} fill={k.c('#5a3c3c')} />) : null}
            <rect x={-R * 1.06} y={-R * 0.18} width={R * 2.12} height={R * 0.18} fill={k.c('#5a3c3c')} />
          </g>
        );
      },
      // пуховик: горизонтальные стёжки
      torso: (k, g) =>
        k.lod > 0 ? (
          <g>
            {[0.25, 0.5, 0.75].map((t, i) => (
              <rect key={i} x={-g.S * 0.48} y={-g.T * t} width={g.S * 0.96} height={0.03 * k.h} fill={k.c('#3b3840')} />
            ))}
          </g>
        ) : null,
      skirt: (k, g) => (
        // тканевая сумка с продуктами, торчит батон
        <g transform={`translate(${-g.W * 0.2},${-0.05 * k.h})`}>
          <ellipse cx={0.18 * k.h} cy={-0.05 * k.h} rx={0.09 * k.h} ry={0.32 * k.h} fill={k.c('#C9A877')} transform={`rotate(18 ${0.18 * k.h} ${-0.05 * k.h})`} />
          <rect x={-0.35 * k.h} y={0} width={0.75 * k.h} height={0.6 * k.h} rx={0.1 * k.h} fill={k.c('#6a6650')} />
        </g>
      ),
    }),
  },
  akhmed: {
    spec: {heightCm: 176, shoulders: 2.05, hips: 1.3, skin: '#A88C74', skinShade: '#82694f', top: '#2F3436', topShade: '#222628', coatLen: 0.25, pants: '#262a2c', shoes: '#d0ccc4', sole: '#8a867e', armW: 0.3, legW: 0.36, face: {eyes: 'slit', brows: 4, mouth: 'line'}},
    slots: () => ({
      behind: (k) => <Backpack k={k} color="#3C4A3E" w={1.5 * k.h} hgt={1.5 * k.h} square />,
      head: (k) => (
        <g>
          <HairCap k={k} color="#1e1b19" line={-0.48} sideDepth={-0.1} />
        </g>
      ),
      torso: (k, g) => (
        <g>
          {/* капюшон на спине/плечах */}
          <path d={`M${-0.55 * k.h},${-g.T} Q0,${-g.T + 0.35 * k.h} ${0.55 * k.h},${-g.T} L${0.4 * k.h},${-g.T - 0.05 * k.h} Q0,${-g.T + 0.15 * k.h} ${-0.4 * k.h},${-g.T - 0.05 * k.h} Z`} fill={k.c('#262a2c')} />
          {/* наушники на шее */}
          <path d={`M${-0.3 * k.h},${-g.T - 0.08 * k.h} Q0,${-g.T + 0.12 * k.h} ${0.3 * k.h},${-g.T - 0.08 * k.h}`} stroke={k.c('#111')} strokeWidth={0.05 * k.h} fill="none" />
          <circle cx={-0.3 * k.h} cy={-g.T - 0.05 * k.h} r={0.08 * k.h} fill={k.c('#111')} />
          <circle cx={0.3 * k.h} cy={-g.T - 0.05 * k.h} r={0.08 * k.h} fill={k.c('#111')} />
          {k.lod > 0 ? <rect x={-g.S * 0.25} y={-g.T * 0.4} width={g.S * 0.5} height={0.25 * k.h} rx={0.05 * k.h} fill={k.c('#262a2c')} /> : null}
          {k.view === 'front' && k.lod > 0 ? (
            <>
              <rect x={-g.S * 0.4} y={-g.T} width={0.08 * k.h} height={g.T * 0.6} fill={k.c('#2b352d')} />
              <rect x={g.S * 0.4 - 0.08 * k.h} y={-g.T} width={0.08 * k.h} height={g.T * 0.6} fill={k.c('#2b352d')} />
            </>
          ) : null}
        </g>
      ),
    }),
  },
  office: {
    spec: {heightCm: 178, shoulders: 2.3, skin: '#BCA894', skinShade: '#94826e', top: '#2f3338', topShade: '#22252a', coatLen: 0.5, pants: '#2a2c30', shoes: '#151515', face: {eyes: 'slit', brows: 0, mouth: 'line'}},
    slots: (seed) => ({
      head: (k) => <HairCap k={k} color={hairColor(seed)} line={-0.5} sideDepth={-0.1} />,
      torso: (k, g) => (
        <g>
          <path d={`M${-0.22 * k.h},${-g.T} L${0.22 * k.h},${-g.T} L0,${-g.T + 0.6 * k.h} Z`} fill={k.c('#c9ccce')} />
          <rect x={-0.04 * k.h} y={-g.T + 0.05 * k.h} width={0.08 * k.h} height={0.5 * k.h} fill={k.c('#4a2a2a')} />
        </g>
      ),
      skirt: (k, g) => <rect x={-g.W * 1.0} y={0.1 * k.h} width={0.8 * k.h} height={0.55 * k.h} rx={0.04 * k.h} fill={k.c('#2a1f18')} />,
    }),
  },
  student: {
    spec: {heightCm: 166, shoulders: 1.95, hips: 1.45, skin: '#C6B4A2', skinShade: '#9e8c7a', top: '#5a4a44', topShade: '#463a35', coatLen: 0.15, pants: '#30343c', shoes: '#cfcbc4', face: {eyes: 'slit', brows: 0, mouth: 'line'}},
    slots: (seed) => ({
      behind: (k) => <Backpack k={k} color="#3a3f48" w={1.0 * k.h} hgt={1.1 * k.h} />,
      headBack: (k) => <ellipse cx={0} cy={k.h * 0.35} rx={k.h * 0.45} ry={k.h * 0.4} fill={k.c(hairColor(seed))} />,
      head: (k) => <HairCap k={k} color={hairColor(seed)} line={-0.4} sideDepth={0.4} />,
    }),
  },
  oldman: {
    spec: {heightCm: 168, shoulders: 2.1, slouch: 8, headForward: 0.15, skin: '#B39F8C', skinShade: '#8a7866', top: '#3e3a33', topShade: '#2e2b26', coatLen: 1.6, coatFlare: 0.2, pants: '#2c2a26', shoes: '#1a1816', face: {eyes: 'dots', brows: 0, mouth: 'line'}},
    slots: () => ({
      head: (k) => {
        const R = k.h / 2;
        return (
          <g>
            <ellipse cx={0} cy={-R * 0.42} rx={R * 1.45} ry={R * 0.16} fill={k.c('#2a2722')} />
            <path d={`M${-R * 0.85},${-R * 0.4} Q${-R * 0.8},${-R * 1.2} 0,${-R * 1.15} Q${R * 0.8},${-R * 1.2} ${R * 0.85},${-R * 0.4} Z`} fill={k.c('#33302a')} />
            <rect x={-R * 0.85} y={-R * 0.6} width={R * 1.7} height={R * 0.12} fill={k.c('#1e1c19')} />
          </g>
        );
      },
      handR: (k) => <rect x={-0.03 * k.h} y={0.15 * k.h} width={0.06 * k.h} height={1.7 * k.h} fill={k.c('#3a2e22')} />,
    }),
  },
  puffer: {
    spec: {heightCm: 164, shoulders: 2.15, hips: 1.6, skin: '#C4B09C', skinShade: '#9c8874', top: '#3d3a44', topShade: '#2e2c34', coatLen: 2.2, coatFlare: 0.12, pants: '#26252a', shoes: '#18171a', face: {eyes: 'slit', brows: -2, mouth: 'line'}},
    slots: (seed) => ({
      head: (k) => <HairCap k={k} color={hairColor(seed)} line={-0.36} sideDepth={0.55} />,
      torso: (k, g) =>
        k.lod > 0 ? (
          <g>
            {[0.3, 0.6].map((t, i) => (
              <rect key={i} x={-g.S * 0.48} y={-g.T * t} width={g.S * 0.96} height={0.03 * k.h} fill={k.c('#2e2c34')} />
            ))}
          </g>
        ) : null,
    }),
  },
  worker: {
    spec: {heightCm: 180, shoulders: 2.45, skin: '#B29C86', skinShade: '#8a7662', top: '#4a4a3e', topShade: '#38382e', coatLen: 0.3, pants: '#3e3e34', shoes: '#1a1916', face: {eyes: 'slit', brows: 4, mouth: 'line'}},
    slots: (seed) => ({
      head: (k) => {
        const R = k.h / 2;
        return (
          <g>
            <path d={`M${-R * 1.04},${-R * 0.1} Q${-R},${-R * 1.15} 0,${-R * 1.1} Q${R},${-R * 1.15} ${R * 1.04},${-R * 0.1} Z`} fill={k.c('#2c2d2a')} />
          </g>
        );
      },
      torso: (k, g) => <rect x={-g.S * 0.3} y={-g.T * 0.7} width={0.3 * k.h} height={0.25 * k.h} fill={k.c('#38382e')} />,
    }),
  },
  teen: {
    spec: {heightCm: 168, shoulders: 1.9, hips: 1.3, skin: '#C6B19C', skinShade: '#9c8874', top: '#2b2e33', topShade: '#1f2125', coatLen: 0.25, pants: '#24272b', shoes: '#cfcbc4', armW: 0.3, legW: 0.34, face: {eyes: 'slit', brows: 0, mouth: 'none'}},
    slots: () => ({
      // капюшон на голове
      head: (k) => {
        const R = k.h / 2;
        return (
          <path d={`M${-R * 1.12},${R * 0.7} Q${-R * 1.25},${-R * 1.3} 0,${-R * 1.2} Q${R * 1.25},${-R * 1.3} ${R * 1.12},${R * 0.7} L${R * 0.82},${R * 0.6} Q${R * 0.85},${-R * 0.6} 0,${-R * 0.7} Q${-R * 0.85},${-R * 0.6} ${-R * 0.82},${R * 0.6} Z`} fill={k.c('#2b2e33')} />
        );
      },
    }),
  },
  business: {
    spec: {heightCm: 170, shoulders: 2.0, hips: 1.45, skin: '#C2AE9A', skinShade: '#9a8672', top: '#5a4f48', topShade: '#463d37', topHi: '#6a5f58', coatLen: 1.5, coatFlare: 0.18, pants: '#2a2828', shoes: '#141313', face: {eyes: 'slit', brows: 0, mouth: 'line'}},
    slots: (seed) => ({
      head: (k) => {
        const R = k.h / 2;
        const off = viewOff(k.view, R);
        return (
          <g>
            <HairCap k={k} color={hairColor(seed)} line={-0.42} sideDepth={0.3} />
            <path d={`M${-R * 1.0 + off},${R * 0.2} Q${-R * 1.25},${R * 0.9} ${-R * 0.7},${R * 1.0} L${-R * 0.85},${R * 0.2} Z`} fill={k.c(hairColor(seed))} />
          </g>
        );
      },
    }),
  },
};

export const Passenger: React.FC<PassengerProps> = (props) => {
  const seed = props.seed ?? 'p0';
  const type = props.type ?? PASSENGER_TYPES[Math.floor(random(`${seed}-type`) * PASSENGER_TYPES.length)];
  const def = DEFS[type];
  const dirt = props.dirt ?? 0;
  const dirty = (c: string) => mix(c, '#2a2824', dirt * 0.35);
  const spec: CharSpec = {
    ...def.spec,
    id: type,
    heightCm: def.spec.heightCm + rnd(`${seed}-dh`, -3, 3),
    top: dirty(def.spec.top),
    topShade: dirty(def.spec.topShade),
    pants: dirty(def.spec.pants),
    coatLen: props.coatOff ? 0 : def.spec.coatLen,
    face: props.cry ? {...def.spec.face, brows: -10} : def.spec.face,
  };
  if (props.coatOff) {
    spec.top = dirty('#4a4846');
    spec.topShade = dirty('#3a3836');
  }
  const pose: Pose = props.pose ?? POSES.sitFront;
  return <Rig {...props} pose={pose} spec={spec} slots={def.slots(seed)} seed={seed} />;
};

export const PASSENGER_POSES: Record<string, Pose> = {
  sit_clutch_bag: {...POSES.sitFront, armL: [-10, 110], armR: [-10, 110]},
  cry: {...POSES.sitFront, shrug: 0.2, armL: [-30, 160], armR: [-30, 160], headPitch: 0.6, headDrop: 0.1},
  sit_floor_backpack: {hipDrop: 2.6, legL: [100, 120], legR: [90, 110], lean: 8, armL: [50, 40], armR: [40, 50], sit: true},
  stand_angry: {armL: [20, 30], armR: [35, 60], lean: 6},
  climb_ladder: {armL: [170, 10], armR: [150, 30], legL: [40, 60], legR: [-5, 10]},
  lying: {hipDrop: 0, rootRot: -90},
};
