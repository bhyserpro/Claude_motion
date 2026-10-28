import React from 'react';
import {mix} from '../../lib/color';
import {CharSpec, Pose, Rig, RigProps, Slots} from './Rig';
import {HeldItem, HeldItemKind} from './items';

/** Глеб Сомов, 41. Длинное прямое пальто, диагональ ремня сумки через грудь. */
export type GlebProps = RigProps & {
  episode?: 1 | 2 | 3 | 4 | 5;
  holdR?: HeldItemKind;
  holdL?: HeldItemKind;
  /** дозиметр Павла торчит из правого кармана (с середины серии 2) */
  pocketDosimeter?: boolean;
  countFinger?: number; // 0..1 — сгиб указательного пальца при счёте
};

export const glebSpec = (ep: number): CharSpec => {
  const pale = ep >= 5 ? 0.15 : ep >= 4 ? 0.08 : 0;
  let skin = mix('#B8A996', '#E8E4DC', pale);
  let skinShade = mix('#8E7F6E', '#B8B4AA', pale);
  if (ep >= 5) {
    skin = mix(skin, '#9AA593', 0.18);
    skinShade = mix(skinShade, '#6F7A6A', 0.18);
  }
  return {
    id: 'gleb',
    heightCm: 182,
    shoulders: 2.3,
    hips: 1.5,
    slouch: 4,
    headForward: 0.06,
    skin,
    skinShade,
    top: '#4A4E43',
    topShade: '#353930',
    topHi: '#5E6355',
    coatLen: 2.25,
    coatFlare: 0.18,
    coatOpen: ep >= 5,
    pants: '#2C2E2C',
    shoes: '#1C1A18',
    sole: '#0F0E0D',
    face: {
      eyes: 'slit',
      brows: 2,
      mouth: 'line',
      nose: true,
      sockets: ep >= 5 ? 0.9 : ep >= 4 ? 0.7 : ep >= 3 ? 0.3 : 0.12,
      socketColor: '#5E5246',
    },
  };
};

const glebSlots = (ep: number, p: GlebProps): Slots => ({
  torso: (k, g) => {
    const {c, h, view, lod} = k;
    if (view === 'back') {
      return lod > 0 ? <path d={`M${g.S * 0.32},${-g.T} L${g.S * 0.4},${-g.T + 0.1 * h} L${-g.W * 0.4},${-0.1 * h} L${-g.W * 0.5},${-0.2 * h} Z`} fill={c('#5A4232')} /> : null;
    }
    const front = view === 'front';
    const profile = view === 'profile';
    const cx = front ? 0 : g.S * 0.16;
    const vDepth = ep >= 2 ? 0.95 * h : 0.85 * h;
    const vTop = -g.T;
    const vw = 0.3 * h;
    const loose = ep >= 2;
    const els: React.ReactNode[] = [];
    if (lod > 0 && profile) {
      els.push(<path key="pc" d={`M${g.S * 0.1},${-g.T} L${g.S * 0.42},${-g.T + 0.05 * h} L${g.S * 0.2},${-g.T + 0.5 * h} Z`} fill={c('#5E6355')} />);
    }
    if (lod > 0 && !profile) {
      // вырез пальто: рубашка + галстук
      els.push(<path key="v" d={`M${cx - vw},${vTop} L${cx + vw},${vTop} L${cx},${vTop + vDepth} Z`} fill={c('#9EA3A0')} />);
      if (loose) els.push(<path key="vo" d={`M${cx - vw * 0.25},${vTop} L${cx + vw * 0.25},${vTop} L${cx},${vTop + 0.22 * h} Z`} fill={c(glebSpec(ep).skinShade)} />);
      const knotY = vTop + (loose ? 0.24 * h : 0.06 * h);
      els.push(<path key="t" d={`M${cx - 0.05 * h},${knotY} L${cx + 0.05 * h},${knotY} L${cx + 0.07 * h},${vTop + vDepth * 0.98} L${cx},${vTop + vDepth * 1.02} L${cx - 0.07 * h},${vTop + vDepth * 0.98} Z`} fill={c('#2E2A2E')} />);
      els.push(<rect key="tk" x={cx - 0.06 * h} y={knotY - 0.06 * h} width={0.12 * h} height={0.09 * h} rx={0.02 * h} fill={c('#241f24')} />);
      // отложной воротник
      els.push(<path key="c1" d={`M${cx - vw - 0.02 * h},${vTop - 0.03 * h} L${cx - vw * 0.15},${vTop + vDepth * 0.55} L${cx - vw - 0.28 * h},${vTop + 0.32 * h} Z`} fill={c('#5E6355')} />);
      els.push(<path key="c2" d={`M${cx + vw + 0.02 * h},${vTop - 0.03 * h} L${cx + vw * 0.15},${vTop + vDepth * 0.55} L${cx + vw + 0.28 * h},${vTop + 0.32 * h} Z`} fill={c('#4f5348')} />);
      // пуговицы на торсе (2 из 4)
      if (!(ep >= 5)) {
        [0.62, 0.82].forEach((t, i) => els.push(<circle key={`b${i}`} cx={cx + 0.12 * h} cy={-g.T * (1 - t)} r={0.04 * h} fill={c('#2A2C27')} />));
      }
      // складка-клин у локтя рисуется в слоте руки; нагрудный карман
      els.push(<rect key="pk" x={cx - g.S * 0.36} y={-g.T * 0.66} width={0.38 * h} height={0.04 * h} fill={c('#353930')} />);
    }
    // ремень сумки по диагонали — главный признак силуэта
    const sx0 = front ? g.S * 0.4 : g.S * 0.05;
    const sx1 = front ? -g.W * 0.55 : -g.W * 0.25;
    els.push(
      <path key="strap" d={`M${sx0 - 0.06 * h},${-g.T - 0.02 * h} L${sx0 + 0.06 * h},${-g.T + 0.02 * h} L${sx1 + 0.05 * h},${0.05 * h} L${sx1 - 0.08 * h},${0.0 * h} Z`} fill={c('#5A4232')} />,
    );
    if (lod > 0) els.push(<rect key="buck" x={(sx0 + sx1) / 2 + 0.05 * h - 0.06 * h} y={-g.T * 0.5 - 0.05 * h} width={0.12 * h} height={0.1 * h} fill={c('#8C8A84')} transform={`rotate(${front ? 35 : 25} ${(sx0 + sx1) / 2} ${-g.T * 0.5})`} />);
    return <g>{els}</g>;
  },
  skirt: (k, g) => {
    const {c, h, view, lod} = k;
    const els: React.ReactNode[] = [];
    if (view === 'back') {
      els.push(<rect key="bag" x={-g.W * 0.9} y={-0.05 * h} width={0.7 * h} height={0.55 * h} rx={0.06 * h} fill={c('#5A4232')} />);
      return <g>{els}</g>;
    }
    const front = view === 'front';
    if (lod > 0) {
      // клапаны карманов
      els.push(<rect key="p1" x={-g.W * 0.48} y={0.35 * h} width={0.4 * h} height={0.07 * h} fill={c('#353930')} />);
      els.push(<rect key="p2" x={g.W * 0.18} y={0.35 * h} width={0.4 * h} height={0.07 * h} fill={c('#2f332b')} />);
      if (ep < 5) {
        [0.12, 0.5].forEach((t, i) => els.push(<circle key={`sb${i}`} cx={(front ? 0 : g.S * 0.12) + 0.12 * h} cy={t * h} r={0.04 * h} fill={c('#2A2C27')} />));
      }
      // дозиметр Павла в правом кармане: жёлтый угол
      if (p.pocketDosimeter) {
        els.push(
          <g key="dos" transform={`translate(${-g.W * 0.36},${0.3 * h}) rotate(-12)`}>
            <rect x={0} y={-0.14 * h} width={0.2 * h} height={0.2 * h} rx={0.03 * h} fill={c('#A88A2E')} />
            <rect x={0.04 * h} y={-0.11 * h} width={0.1 * h} height={0.05 * h} fill={c('#B9C64A')} opacity={0.6} />
          </g>,
        );
      }
    }
    // сумка на правом бедре
    const bx = front ? -g.W * 0.95 : -g.W * 0.75;
    els.push(<rect key="bag" x={bx} y={-0.02 * h} width={0.68 * h} height={0.55 * h} rx={0.06 * h} fill={c('#5A4232')} />);
    if (lod > 0) {
      els.push(<path key="flap" d={`M${bx},${-0.02 * h} L${bx + 0.68 * h},${-0.02 * h} L${bx + 0.68 * h},${0.2 * h} Q${bx + 0.34 * h},${0.28 * h} ${bx},${0.2 * h} Z`} fill={c('#4a3628')} />);
      els.push(<rect key="bb" x={bx + 0.3 * h} y={0.18 * h} width={0.08 * h} height={0.08 * h} fill={c('#8C8A84')} />);
    }
    return <g>{els}</g>;
  },
  head: (k) => {
    const {c, h, view, lod} = k;
    const R = h / 2;
    const els: React.ReactNode[] = [];
    // волосы-«шапочка»
    if (view === 'back') {
      els.push(<path key="hb" d={`M${-R * 1.04},${R * 0.1} A${R * 1.04},${R * 1.04} 0 0 1 ${R * 1.04},${R * 0.1} L${R * 0.9},${R * 0.5} Q0,${R * 0.62} ${-R * 0.9},${R * 0.5} Z`} fill={c('#2B2622')} />);
    } else {
      const off = view === 'front' ? 0 : view === 'three_quarter' ? -R * 0.12 : -R * 0.25;
      els.push(<path key="h" d={`M${-R * 1.04},${-R * 0.02} A${R * 1.04},${R * 1.04} 0 0 1 ${R * 1.04},${-R * 0.02} Q${R * 0.7},${-R * 0.42} ${R * 0.2 + off},${-R * 0.44} Q${-R * 0.5},${-R * 0.5} ${-R * 1.02},${-R * 0.02} Z`} fill={c('#2B2622')} />);
      // клинья чёлки (в серии 5 остаётся один)
      const wedges = ep >= 5 ? [0] : [-1, 0, 1];
      wedges.forEach((i) =>
        els.push(
          <path
            key={`w${i}`}
            d={`M${off + i * R * 0.28 - R * 0.14},${-R * 0.46} L${off + i * R * 0.28 + R * 0.16},${-R * 0.46} L${off + i * R * 0.28 + R * 0.02},${-R * 0.22} Z`}
            fill={c('#2B2622')}
          />,
        ),
      );
      if (lod > 0) {
        // седина на висках
        els.push(<path key="g1" d={`M${-R * 1.0},${-R * 0.05} L${-R * 0.82},${-R * 0.35} L${-R * 0.8},${R * 0.15} Z`} fill={c('#6B6660')} />);
        if (view === 'front') els.push(<path key="g2" d={`M${R * 1.0},${-R * 0.05} L${R * 0.82},${-R * 0.35} L${R * 0.8},${R * 0.15} Z`} fill={c('#6B6660')} />);
      }
      if (lod > 1) {
        // карандаш за ухом
        if (ep <= 2) els.push(<rect key="pc" x={-R * 1.05} y={-R * 0.28} width={R * 0.07} height={R * 0.6} rx={R * 0.03} fill={c('#7d6a3a')} transform={`rotate(-28 ${-R} 0)`} />);
        // щетина
        if (ep >= 2) {
          // щетина: полупрозрачная «шапочка» на подбородке и челюсти, верх — почти прямой
          const yTop = R * 0.42;
          const xs = Math.sqrt(R * R - yTop * yTop);
          els.push(<path key="st" d={`M${-xs},${yTop} A${R},${R} 0 0 0 ${xs},${yTop} L${R * 0.3},${yTop + R * 0.05} L${-R * 0.3},${yTop + R * 0.05} Z`} fill={c('#3A332D')} opacity={0.35} />);
        }
        // царапина на щеке
        if (ep >= 3) els.push(<path key="sc" d={`M${R * 0.38},${R * 0.1} L${R * 0.62},${R * 0.32}`} stroke={c('#7A1712')} strokeWidth={R * 0.035} />);
        // кровь из носа
        if (ep >= 5) els.push(<path key="nb" d={`M${R * 0.05},${R * 0.33} Q${R * 0.08},${R * 0.5} ${R * 0.04},${R * 0.62}`} stroke={c('#7A1712')} strokeWidth={R * 0.04} fill="none" />);
      }
    }
    return <g>{els}</g>;
  },
  armL: (k, segm) => {
    const {c, h, lod} = k;
    if (segm === 'lower' && lod > 0) {
      // часы на левом запястье
      return (
        <g transform={`translate(0,${1.0 * h})`}>
          <rect x={-0.17 * h} y={-0.04 * h} width={0.34 * h} height={0.08 * h} fill={c('#1A1A1A')} />
          <circle cx={0} cy={0} r={0.08 * h} fill={c('#CFC6B2')} />
        </g>
      );
    }
    if (segm === 'upper' && lod > 1) return <path d={`M${-0.1 * h},${1.05 * h} L${0.12 * h},${1.12 * h} L${-0.05 * h},${1.2 * h} Z`} fill={c('#353930')} />;
    return null;
  },
  handR: (k) => (p.holdR ? <HeldItem kind={p.holdR} k={k} /> : null),
  handL: (k) => (p.holdL ? <HeldItem kind={p.holdL} k={k} /> : null),
});

export const Gleb: React.FC<GlebProps> = (props) => {
  const ep = props.episode ?? 1;
  const ash = props.ash ?? (ep === 2 ? 0.1 : ep === 3 ? 0.6 : ep >= 4 ? 0.5 : 0);
  // дозиметр Павла лежит в кармане с конца серии 2
  const p = {...props, pocketDosimeter: props.pocketDosimeter ?? ep >= 3};
  return <Rig {...p} ash={ash} spec={glebSpec(ep)} slots={glebSlots(ep, p)} seed={props.seed ?? 'gleb'} />;
};

export const GLEB_POSES: Record<string, Pose> = {
  stand_idle: {armL: [5, 6], armR: [5, 10]},
  count: {armL: [5, 6], armR: [18, 70], handR: 'point'},
  write: {armL: [30, 95], armR: [26, 100], headPitch: 0.6, headTilt: 6},
  kneel_inspect: {hipDrop: 1.1, legL: [80, 95], legR: [-10, 100], lean: 18, armL: [55, 40], armR: [20, 50], headPitch: 0.5},
  sit_slumped: {hipDrop: 1.5, legL: [72, 68], legR: [66, 72], lean: 16, headTilt: 10, armL: [10, 40], armR: [6, 45], sit: true},
  freeze_hold_breath: {shrug: 0.18, armL: [2, 120], armR: [2, 120], headDrop: 0.08, headTilt: -3},
  hand_on_horn: {armL: [70, 20], armR: [10, 20], lean: 6},
};
