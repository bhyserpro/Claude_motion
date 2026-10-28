import React from 'react';
import {random} from 'remotion';
import {mix} from '../../lib/color';

/**
 * Базовый риг персонажа. Плоский геометрический вектор, без обводок.
 * Единицы: 1000 = 180 см. Начало координат — земля под центром ступней, y вниз.
 *
 * Иерархия: root → hips → (leg_L, leg_R, torso → (arm_L, arm_R, neck → head)).
 * Углы конечностей (в градусах):
 *  - front/back: плечо/бедро «+» = от тела наружу, локоть «+» = к центру;
 *  - three_quarter/profile (лицом вправо; facing = -1 зеркалит): плечо/бедро «+» = вперёд,
 *    локоть «+» = сгиб вперёд, колено «+» = сгиб назад. L — ближняя к камере сторона.
 */

export type Light = 'warm' | 'emergency' | 'flashlight' | 'silhouette' | 'dark';
export type View = 'front' | 'three_quarter' | 'profile' | 'back';
export type LOD = 0 | 1 | 2;

export type Pose = {
  lean?: number;
  headTilt?: number;
  headDrop?: number; // в головах: насколько голова ушла в плечи
  headYaw?: number; // -1..1 поворот головы (сдвиг черт лица)
  headPitch?: number; // -1..1, «+» — взгляд вниз
  armL?: [number, number];
  armR?: [number, number];
  legL?: [number, number];
  legR?: [number, number];
  thighScale?: number; // ракурсное укорочение бёдер (сидя анфас)
  hipDrop?: number; // в головах
  rootRot?: number;
  rootDy?: number; // в головах
  shrug?: number; // плечи вверх (в головах)
  handL?: HandShape;
  handR?: HandShape;
  sit?: boolean;
};

export type HandShape = 'mitten' | 'fist' | 'open' | 'point' | 'hidden';

export type Face = {
  eyes?: 'slit' | 'oval' | 'dots' | 'white' | 'closed' | 'none' | 'dead';
  brows?: number | null; // угол бровей; «+» — к центру вниз (хмурость), «−» — домиком
  mouth?: 'line' | 'open' | 'none' | 'gravel' | 'tight';
  nose?: boolean;
  sockets?: number; // 0..1 глубина теней глазниц
  socketColor?: string;
  blush?: string;
};

export type Ctx = {
  c: (hex: string) => string; // маппинг цвета с учётом света/тумана
  h: number; // диаметр головы
  lod: LOD;
  view: View;
  light: Light;
  frame: number;
  rim: boolean; // true — рисуется копия-контур
  side: number; // для слотов конечностей: +1 / -1
};

export type CharSpec = {
  id: string;
  heightCm: number;
  shoulders: number;
  hips?: number;
  neckW?: number;
  headScale?: number;
  slouch?: number;
  headForward?: number;
  torsoShape?: 'trap' | 'bell' | 'square';
  skin: string;
  skinShade: string;
  top: string;
  topShade: string;
  topHi?: string;
  sleeve?: string;
  sleeveShade?: string;
  coatLen?: number; // ниже бёдер, в головах (0 — нет полы)
  coatFlare?: number;
  coatOpen?: boolean;
  pants: string;
  pantsShade?: string;
  shoes: string;
  sole?: string;
  barefoot?: boolean;
  hand?: string;
  handShade?: string;
  armW?: number;
  legW?: number;
  still?: boolean;
  face?: Face;
};

export type Slots = {
  behind?: (k: Ctx) => React.ReactNode; // за торсом (рюкзак, пучок)
  torso?: (k: Ctx, T: TorsoGeo) => React.ReactNode; // поверх торса
  skirt?: (k: Ctx, T: TorsoGeo) => React.ReactNode; // поверх полы
  headBack?: (k: Ctx) => React.ReactNode;
  head?: (k: Ctx) => React.ReactNode; // поверх головы (волосы, кепка, очки)
  face?: (k: Ctx) => React.ReactNode; // вместо стандартного лица
  handL?: (k: Ctx) => React.ReactNode;
  handR?: (k: Ctx) => React.ReactNode;
  armL?: (k: Ctx, seg: 'upper' | 'lower') => React.ReactNode;
  armR?: (k: Ctx, seg: 'upper' | 'lower') => React.ReactNode;
  leg?: (k: Ctx, seg: 'thigh' | 'shin' | 'foot') => React.ReactNode;
  over?: (k: Ctx, T: TorsoGeo) => React.ReactNode; // поверх головы, но под руками (воротник)
  ash?: (k: Ctx, T: TorsoGeo) => React.ReactNode;
};

export type TorsoGeo = {
  T: number; // высота торса
  S: number; // ширина плеч (с учётом ракурса)
  W: number; // ширина таза
  vf: number; // коэффициент ракурса по ширине
  neckH: number;
  headY: number; // центр головы в координатах торса
};

export type RigProps = {
  x?: number;
  y?: number;
  scale?: number;
  facing?: 1 | -1;
  view?: View;
  light?: Light;
  lod?: LOD;
  pose?: Pose;
  frame?: number;
  ash?: number;
  fog?: number;
  fogColor?: string;
  rimDir?: number; // угол прихода контрового света, градусы (0 — справа)
  rimColor?: string;
  rimOpacity?: number;
  breathe?: boolean;
  opacity?: number;
  face?: Face;
  seed?: string;
};

export const LIGHT_FN: Record<Light, (c: string) => string> = {
  warm: (c) => c,
  emergency: (c) => mix(mix(c, '#000000', 0.55), '#3a0b08', 0.42),
  flashlight: (c) => mix(c, '#D9E4E8', 0.35),
  silhouette: () => '#07090A',
  dark: (c) => mix(c, '#07090A', 0.82),
};

/** Серп (тень/блик) на круге: сторона ang (градусы), толщина k (0..1). */
export const crescent = (cx: number, cy: number, R: number, ang: number, k: number) => {
  const a = (ang * Math.PI) / 180;
  const p1 = [cx + Math.cos(a - Math.PI / 2) * R, cy + Math.sin(a - Math.PI / 2) * R];
  const p2 = [cx + Math.cos(a + Math.PI / 2) * R, cy + Math.sin(a + Math.PI / 2) * R];
  const R2 = R / Math.max(0.05, 1 - k * 0.98);
  return `M${p1[0]},${p1[1]} A${R},${R} 0 0 1 ${p2[0]},${p2[1]} A${R2},${R2} 0 0 0 ${p1[0]},${p1[1]} Z`;
};

/** Скруглённый «сегмент» конечности от (0,0) вниз длиной len. */
const seg = (len: number, w0: number, w1: number) => {
  const r0 = w0 / 2;
  const r1 = w1 / 2;
  return `M${-r0},0 A${r0},${r0} 0 0 1 ${r0},0 L${r1},${len} A${r1},${r1} 0 0 1 ${-r1},${len} Z`;
};

export const breathK = (frame: number, phase: number) => 1 + 0.012 * Math.sin((frame / (3.6 * 30)) * Math.PI * 2 + phase);

/** Главный компонент рига. */
export const Rig: React.FC<RigProps & {spec: CharSpec; slots?: Slots}> = (props) => {
  const {
    x = 0,
    y = 0,
    scale = 1,
    facing = 1,
    view = 'front',
    light = 'warm',
    rimDir = -30,
    rimColor = '#B3261E',
    rimOpacity = 0.6,
    opacity = 1,
  } = props;
  const wantRim = light === 'emergency' || light === 'silhouette';
  const rimLen = (props.spec.heightCm / 180) * 1000 * 0.012;
  const rx = Math.cos((rimDir * Math.PI) / 180) * rimLen;
  const ry = Math.sin((rimDir * Math.PI) / 180) * rimLen;
  return (
    <g transform={`translate(${x},${y}) scale(${scale * facing},${scale})`} opacity={opacity}>
      {wantRim ? (
        <g transform={`translate(${rx * facing},${ry})`} opacity={rimOpacity}>
          <RigBody {...props} rimFill={rimColor} />
        </g>
      ) : null}
      <RigBody {...props} />
    </g>
  );
};

const RigBody: React.FC<RigProps & {spec: CharSpec; slots?: Slots; rimFill?: string}> = ({
  spec,
  slots = {},
  view = 'front',
  light = 'warm',
  lod = 1,
  pose = {},
  frame = 0,
  ash = 0,
  fog = 0,
  fogColor = '#07090A',
  breathe,
  face,
  seed = 'rig',
  rimFill,
}) => {
  const Hgt = (spec.heightCm / 180) * 1000;
  const h = (Hgt / 6) * (spec.headScale ?? 1);
  const hu = Hgt / 6; // единица пропорций тела
  const lf = LIGHT_FN[light];
  const c = rimFill
    ? () => rimFill
    : fog > 0
      ? (hex: string) => mix(lf(hex), fogColor, fog)
      : lf;
  const side = view === 'front' || view === 'back';
  const vf = view === 'front' || view === 'back' ? 1 : view === 'three_quarter' ? 0.8 : 0.52;
  const k: Ctx = {c, h: hu, lod, view, light, frame, rim: !!rimFill, side: 1};

  const still = spec.still || breathe === false;
  const phase = random(`${seed}-ph`) * 6.28;
  const breath = still ? 1 : breathK(frame, phase);
  const sway = still ? 0 : Math.sin((frame / (5.3 * 30)) * Math.PI * 2 + phase) * 0.35;

  // пропорции
  const S = spec.shoulders * hu * vf;
  const W = (spec.hips ?? spec.shoulders * 0.62) * hu * (side ? 1 : Math.max(0.6, vf));
  const T = 1.72 * hu;
  const neckH = 0.2 * hu;
  const neckW = (spec.neckW ?? 0.45) * hu * (side ? 1 : 0.9);
  const aw = (spec.armW ?? 0.36) * hu;
  const lw = (spec.legW ?? 0.44) * hu;
  const upper = 1.2 * hu;
  const lower = 1.05 * hu;
  const thigh = 1.48 * hu * (pose.thighScale ?? 1);
  const shin = 1.36 * hu;
  const footH = 0.14 * hu;
  const hipY = -(3 * hu) + (pose.hipDrop ?? 0) * hu;
  const lean = (spec.slouch ?? 0) * (side ? 0 : 1) + (pose.lean ?? 0);
  const headDrop = (pose.headDrop ?? 0) * hu;
  const shrug = (pose.shrug ?? 0) * hu;
  const headY = -T - neckH - h / 2 + headDrop - (side ? (spec.slouch ?? 0) * 0.01 * hu : 0);
  const headFwd = side ? 0 : (spec.headForward ?? 0) * hu;
  const geo: TorsoGeo = {T, S, W, vf, neckH, headY};

  const top = spec.top;
  const topShade = spec.topShade;
  const sleeve = spec.sleeve ?? top;
  const sleeveShade = spec.sleeveShade ?? topShade;
  const hand = spec.hand ?? spec.skin;
  const handShade = spec.handShade ?? spec.skinShade;
  const pants = spec.pants;
  const pantsShade = spec.pantsShade ?? mix(pants, '#000000', 0.3);

  // --- углы конечностей в SVG
  const armAng = (a: [number, number] | undefined, s: number) => {
    const [sh, el] = a ?? [side ? 6 : 4, side ? 4 : 8];
    return side ? [-s * sh, s * el] : [-sh, -el];
  };
  const legAng = (a: [number, number] | undefined, s: number) => {
    const [hp, kn] = a ?? [side ? 3 : 0, 0];
    return side ? [-s * hp, s * kn * 0.2] : [-hp, kn];
  };

  // --- кисть
  const Hand: React.FC<{shape: HandShape; s: number; slot?: (k: Ctx) => React.ReactNode}> = ({shape, s, slot}) => {
    if (shape === 'hidden') return slot ? <>{slot({...k, side: s})}</> : null;
    const pw = 0.17 * hu;
    const ph = shape === 'fist' ? 0.18 * hu : 0.24 * hu;
    return (
      <g>
        <ellipse cx={0} cy={ph * 0.55} rx={pw} ry={ph * 0.6} fill={c(hand)} />
        {lod > 0 ? <ellipse cx={pw * 0.35} cy={ph * 0.8} rx={pw * 0.55} ry={ph * 0.35} fill={c(handShade)} opacity={0.6} /> : null}
        {shape !== 'fist' ? (
          <ellipse cx={-s * pw * 0.85} cy={ph * 0.35} rx={pw * 0.32} ry={ph * 0.42} fill={c(hand)} transform={`rotate(${s * 25} ${-s * pw * 0.85} ${ph * 0.35})`} />
        ) : null}
        {shape === 'point' ? <rect x={-pw * 0.18} y={ph * 0.9} width={pw * 0.36} height={ph * 0.9} rx={pw * 0.18} fill={c(hand)} /> : null}
        {slot ? slot({...k, side: s}) : null}
      </g>
    );
  };

  // --- рука
  const Arm: React.FC<{which: 'L' | 'R'; s: number; far?: boolean}> = ({which, s, far}) => {
    const a = which === 'L' ? pose.armL : pose.armR;
    const [u, l] = armAng(a, s);
    // в 3/4 ближняя рука (L) — у задней кромки торса, дальняя (R) — у передней, за торсом
    const sideK = view === 'profile' ? 0.08 : 0.62;
    const sx = side ? s * (S / 2 - aw * 0.42) : (which === 'L' ? -1 : 1) * (S * 0.5 - aw * 0.5) * sideK;
    const sy = -T + aw * 0.42 + 0.1 * hu - shrug;
    const dim = far ? 0.25 : 0;
    const col = (hex: string) => (far ? mix(c(hex), '#000000', dim) : c(hex));
    const sl = which === 'L' ? slots.armL : slots.armR;
    const shape = (which === 'L' ? pose.handL : pose.handR) ?? 'mitten';
    return (
      <g transform={`translate(${sx},${sy}) rotate(${u})`}>
        <path d={seg(upper, aw, aw * 0.92)} fill={col(sleeve)} />
        {lod > 0 ? <path d={seg(upper, aw * 0.4, aw * 0.36)} transform={`translate(${s * aw * 0.26},0)`} fill={col(sleeveShade)} opacity={0.8} /> : null}
        {sl ? sl({...k, side: s}, 'upper') : null}
        <g transform={`translate(0,${upper}) rotate(${l})`}>
          <path d={seg(lower, aw * 0.9, aw * 0.8)} fill={col(sleeve)} />
          {lod > 0 ? <path d={seg(lower, aw * 0.34, aw * 0.3)} transform={`translate(${s * aw * 0.25},0)`} fill={col(sleeveShade)} opacity={0.8} /> : null}
          {sl ? sl({...k, side: s}, 'lower') : null}
          <g transform={`translate(0,${lower - 0.02 * hu})`}>
            <Hand shape={shape} s={side ? s : 1} slot={which === 'L' ? slots.handL : slots.handR} />
          </g>
        </g>
      </g>
    );
  };

  // --- нога
  const Leg: React.FC<{which: 'L' | 'R'; s: number; far?: boolean}> = ({which, s, far}) => {
    const a = which === 'L' ? pose.legL : pose.legR;
    const [hp, kn] = legAng(a, s);
    const lx = side ? s * (W / 2 - lw * 0.5) : (far ? -1 : 1) * lw * 0.12;
    const col = (hex: string) => (far ? mix(c(hex), '#000000', 0.22) : c(hex));
    const footLen = 0.5 * hu;
    const footRot = -(hp + kn);
    return (
      <g transform={`translate(${lx},0) rotate(${hp})`}>
        <path d={seg(thigh, lw, lw * 0.86)} fill={col(pants)} />
        {lod > 0 ? <path d={seg(thigh, lw * 0.3, lw * 0.26)} transform={`translate(${(side ? s : -1) * lw * 0.3},0)`} fill={col(pantsShade)} /> : null}
        {slots.leg ? slots.leg({...k, side: s}, 'thigh') : null}
        <g transform={`translate(0,${thigh}) rotate(${kn})`}>
          <path d={seg(shin, lw * 0.86, lw * 0.72)} fill={col(pants)} />
          {lod > 0 ? <path d={seg(shin, lw * 0.26, lw * 0.22)} transform={`translate(${(side ? s : -1) * lw * 0.28},0)`} fill={col(pantsShade)} /> : null}
          {slots.leg ? slots.leg({...k, side: s}, 'shin') : null}
          <g transform={`translate(0,${shin}) rotate(${footRot})`}>
            {side ? (
              <g>
                {spec.barefoot ? (
                  <ellipse cx={s * 0.04 * hu} cy={-footH * 0.2} rx={lw * 0.42} ry={footH * 0.9} fill={col(spec.shoes)} />
                ) : (
                  <>
                    <path d={`M${-lw * 0.5},${footH * 0.4} Q${-lw * 0.5},${-footH * 1.4} ${s * lw * 0.1},${-footH * 1.4} Q${lw * 0.55},${-footH * 1.4} ${lw * 0.55},${footH * 0.4} Z`} transform={`translate(${s * lw * 0.05},0)`} fill={col(spec.shoes)} />
                    {lod > 0 ? <rect x={-lw * 0.5} y={footH * 0.1} width={lw * 1.1} height={footH * 0.35} rx={footH * 0.15} fill={col(spec.sole ?? '#0F0E0D')} /> : null}
                  </>
                )}
              </g>
            ) : (
              <g>
                {spec.barefoot ? (
                  <ellipse cx={footLen * 0.35} cy={-footH * 0.15} rx={footLen * 0.62} ry={footH * 0.85} fill={col(spec.shoes)} />
                ) : (
                  <>
                    <path d={`M${-lw * 0.42},${footH * 0.4} L${-lw * 0.42},${-footH * 1.2} Q${footLen * 0.3},${-footH * 1.6} ${footLen * 0.95},${-footH * 0.2} L${footLen * 0.95},${footH * 0.4} Z`} fill={col(spec.shoes)} />
                    {lod > 0 ? <rect x={-lw * 0.45} y={footH * 0.1} width={footLen * 1.42} height={footH * 0.35} rx={footH * 0.15} fill={col(spec.sole ?? '#0F0E0D')} /> : null}
                  </>
                )}
              </g>
            )}
            {slots.leg ? slots.leg({...k, side: s}, 'foot') : null}
          </g>
        </g>
      </g>
    );
  };

  // --- торс
  const torsoPath = () => {
    const sTop = -T - shrug * 0.6;
    const slope = 0.24 * hu;
    const xo = side ? 0 : -S * 0.04;
    const nk = Math.max(neckW * 0.75, S * 0.2);
    if (spec.torsoShape === 'bell') {
      return `M${-nk + xo},${sTop} L${nk + xo},${sTop} Q${S * 0.42 + xo},${sTop} ${S / 2 + xo},${sTop + slope * 1.4} L${W / 2},0 L${-W / 2},0 L${-S / 2 + xo},${sTop + slope * 1.4} Q${-S * 0.42 + xo},${sTop} ${-nk + xo},${sTop} Z`;
    }
    if (spec.torsoShape === 'square') {
      return `M${-nk + xo},${sTop} L${nk + xo},${sTop} Q${S * 0.47 + xo},${sTop} ${S / 2 + xo},${sTop + slope * 0.7} L${S * 0.47 + xo},${-T * 0.35} L${W / 2},0 L${-W / 2},0 L${-S * 0.47 + xo},${-T * 0.35} L${-S / 2 + xo},${sTop + slope * 0.7} Q${-S * 0.47 + xo},${sTop} ${-nk + xo},${sTop} Z`;
    }
    return `M${-nk + xo},${sTop} L${nk + xo},${sTop} Q${S * 0.44 + xo},${sTop} ${S / 2 + xo},${sTop + slope} L${W / 2},0 L${-W / 2},0 L${-S / 2 + xo},${sTop + slope} Q${-S * 0.44 + xo},${sTop} ${-nk + xo},${sTop} Z`;
  };

  // пола пальто
  const coatLen = (spec.coatLen ?? 0) * hu;
  const flare = (spec.coatFlare ?? 0.25) * hu;
  const skirt = () => {
    if (coatLen <= 0) return null;
    if (pose.sit && !side) {
      // сидя в профиль: пола ложится на бедро
      const tl = 1.48 * hu;
      return (
        <path
          d={`M${-W * 0.55},${-0.1 * hu} L${W * 0.5},${-0.15 * hu} L${tl + 0.1 * hu},${-lw * 0.6} L${tl + 0.15 * hu},${Math.min(coatLen - 1.2 * hu, 1.2 * hu) + lw * 0.3} L${tl - 0.2 * hu},${Math.min(coatLen - 1.2 * hu, 1.2 * hu) + lw * 0.5} L${tl * 0.7},${lw * 0.55} L${-W * 0.62},${lw * 0.7} Z`}
          fill={c(top)}
        />
      );
    }
    if (pose.sit && side) {
      const L = Math.min(coatLen, 1.0 * hu);
      return <path d={`M${-W / 2},${-0.05 * hu} L${W / 2},${-0.05 * hu} L${W / 2 + flare * 0.4},${L} L${-W / 2 - flare * 0.4},${L} Z`} fill={c(top)} />;
    }
    const wob = Math.sin(frame / 20) * 0; // пола не качается сама по себе
    const hw = W / 2 + flare;
    const off = side ? 0 : -0.06 * hu;
    return (
      <g>
        <path d={`M${-W / 2},${-0.05 * hu} L${W / 2},${-0.05 * hu} L${hw + off + wob},${coatLen} L${-hw + off},${coatLen} Z`} fill={c(top)} />
        {lod > 0 ? <path d={`M${W * 0.12},${-0.05 * hu} L${W / 2},${-0.05 * hu} L${hw + off},${coatLen} L${hw * 0.35 + off},${coatLen} Z`} fill={c(topShade)} opacity={0.9} /> : null}
        {lod > 0 && side && spec.coatOpen ? <path d={`M${-0.04 * hu},0 L${0.04 * hu},0 L${0.12 * hu},${coatLen} L${-0.12 * hu},${coatLen} Z`} fill={c(mix(pants, '#000', 0.2))} /> : null}
        {lod > 0 && side && !spec.coatOpen ? <line x1={0} y1={0} x2={0} y2={coatLen} stroke={c(topShade)} strokeWidth={0.03 * hu} /> : null}
      </g>
    );
  };

  // --- лицо
  const f: Face = {...spec.face, ...face};
  const yaw = (pose.headYaw ?? 0) + (view === 'three_quarter' ? 0.42 : view === 'profile' ? 0.78 : 0);
  const pitch = pose.headPitch ?? 0;
  const R = h / 2;
  const dark = light === 'silhouette' || light === 'dark';
  const renderFace = () => {
    if (view === 'back') return null;
    if (slots.face) return slots.face(kh);
    if (lod < 2 && !(f.eyes === 'white')) {
      if (dark && lod >= 1 && f.eyes !== 'none') {
        // в темноте вместо глаз — два крошечных блика
        const ex = yaw * R * 0.5;
        return (
          <g>
            <circle cx={ex - R * 0.28 * (1 - Math.abs(yaw) * 0.4)} cy={-R * 0.02} r={R * 0.035} fill="#D9E4E8" opacity={0.7} />
            <circle cx={ex + R * 0.28 * (1 - Math.abs(yaw) * 0.6)} cy={-R * 0.02} r={R * 0.035} fill="#D9E4E8" opacity={0.7} />
          </g>
        );
      }
      return null;
    }
    const ex = yaw * R * 0.52;
    const ey = R * 0.02 + pitch * R * 0.25;
    const gap = R * 0.3 * (1 - Math.abs(yaw) * 0.35);
    const farK = 1 - Math.max(0, Math.abs(yaw) - 0.45) * 2.6;
    const eyeCol = '#0B0D0D';
    const els: React.ReactNode[] = [];
    if (f.sockets && f.sockets > 0) {
      els.push(
        <g key="sk" opacity={f.sockets * 0.8}>
          <ellipse cx={ex - gap} cy={ey - R * 0.02} rx={R * 0.2} ry={R * 0.13} fill={c(f.socketColor ?? '#5E5246')} />
          {farK > 0.2 ? <ellipse cx={ex + gap} cy={ey - R * 0.02} rx={R * 0.2 * farK} ry={R * 0.13} fill={c(f.socketColor ?? '#5E5246')} /> : null}
        </g>,
      );
    }
    const eye = (cx: number, sc: number, key: string) => {
      if (sc <= 0.15) return null;
      switch (f.eyes) {
        case 'slit':
          return <rect key={key} x={cx - R * 0.12 * sc} y={ey - R * 0.022} width={R * 0.24 * sc} height={R * 0.045} rx={R * 0.02} fill={dark ? '#D9E4E8' : eyeCol} opacity={dark ? 0.5 : 1} />;
        case 'oval':
          return <ellipse key={key} cx={cx} cy={ey} rx={R * 0.06 * sc} ry={R * 0.08} fill={eyeCol} />;
        case 'dots':
          return <circle key={key} cx={cx} cy={ey} r={R * 0.045} fill={eyeCol} />;
        case 'closed':
          return <path key={key} d={`M${cx - R * 0.11 * sc},${ey} Q${cx},${ey + R * 0.05} ${cx + R * 0.11 * sc},${ey}`} stroke={eyeCol} strokeWidth={R * 0.03} fill="none" />;
        case 'white':
          // молочно-белые глаза без зрачков: тёмная воспалённая глазница + слабое свечение
          return (
            <g key={key}>
              {!rimFill ? <ellipse cx={cx} cy={ey} rx={R * 0.2 * sc} ry={R * 0.14} fill={c('#5b5148')} opacity={0.75} /> : null}
              <ellipse cx={cx} cy={ey} rx={R * 0.2 * sc} ry={R * 0.12} fill="#E3DDD2" opacity={rimFill ? 0 : 0.25} />
              <ellipse cx={cx} cy={ey} rx={R * 0.12 * sc} ry={R * 0.075} fill={rimFill ? rimFill : '#F1ECE3'} />
            </g>
          );
        case 'dead':
          return (
            <g key={key}>
              {!rimFill ? <ellipse cx={cx} cy={ey} rx={R * 0.17 * sc} ry={R * 0.12} fill={c('#5e5650')} opacity={0.7} /> : null}
              <ellipse cx={cx} cy={ey} rx={R * 0.12 * sc} ry={R * 0.07} fill={rimFill ? rimFill : '#cfc9bd'} />
              {!rimFill ? <circle cx={cx + R * 0.015} cy={ey - R * 0.02} r={R * 0.022} fill="#4a4844" /> : null}
              {/* веко опущено на треть — неподвижный взгляд */}
              {!rimFill ? <path d={`M${cx - R * 0.14 * sc},${ey - R * 0.01} Q${cx},${ey - R * 0.13} ${cx + R * 0.14 * sc},${ey - R * 0.01} L${cx + R * 0.14 * sc},${ey - R * 0.12} L${cx - R * 0.14 * sc},${ey - R * 0.12} Z`} fill={c(spec.skinShade)} /> : null}
            </g>
          );
        default:
          return null;
      }
    };
    els.push(eye(ex - gap, 1 - Math.max(0, yaw) * 0.25, 'e1'));
    els.push(eye(ex + gap, farK, 'e2'));
    if (f.brows !== undefined && f.brows !== null && lod >= 2) {
      const bAng = f.brows;
      const by = ey - R * 0.17;
      els.push(
        <rect key="b1" x={ex - gap - R * 0.13} y={by - R * 0.022} width={R * 0.26} height={R * 0.045} fill={c('#2B2622')} transform={`rotate(${bAng} ${ex - gap} ${by})`} />,
      );
      if (farK > 0.2)
        els.push(
          <rect key="b2" x={ex + gap - R * 0.13 * farK} y={by - R * 0.022} width={R * 0.26 * farK} height={R * 0.045} fill={c('#2B2622')} transform={`rotate(${-bAng} ${ex + gap} ${by})`} />,
        );
    }
    if (f.nose) {
      els.push(<path key="n" d={`M${ex + R * 0.04},${ey + R * 0.05} L${ex + R * 0.13},${ey + R * 0.3} L${ex - R * 0.02},${ey + R * 0.3} Z`} fill={c(spec.skinShade)} opacity={0.7} />);
    }
    const my = ey + R * 0.48;
    if (f.mouth === 'line' || f.mouth === 'tight') {
      els.push(<rect key="m" x={ex - R * 0.14} y={my - R * 0.018} width={R * 0.28} height={R * (f.mouth === 'tight' ? 0.05 : 0.035)} rx={R * 0.015} fill={c('#3a2a24')} />);
    } else if (f.mouth === 'open') {
      els.push(<ellipse key="m" cx={ex} cy={my + R * 0.04} rx={R * 0.13} ry={R * 0.16} fill="#0B0505" />);
    } else if (f.mouth === 'gravel') {
      els.push(<Gravel key="g" cx={ex} cy={my} R={R} seed={`${seed}-gr`} c={c} />);
    }
    if (f.blush) els.push(<ellipse key="bl" cx={ex + gap * 1.2} cy={ey + R * 0.25} rx={R * 0.13} ry={R * 0.08} fill={c(f.blush)} opacity={0.5} />);
    return <g>{els}</g>;
  };

  // --- пепел
  const ashDots = () => {
    if (ash <= 0 || lod === 0 || rimFill) return null;
    const n = Math.round(ash * 60);
    const dots: React.ReactNode[] = [];
    for (let i = 0; i < n; i++) {
      const u = random(`${seed}-ash-u${i}`);
      const v = random(`${seed}-ash-v${i}`);
      const zone = random(`${seed}-ash-z${i}`);
      let px: number;
      let py: number;
      if (zone < 0.55) {
        px = (u - 0.5) * S * 0.95;
        py = -T - shrug * 0.6 + v * 0.35 * hu;
      } else if (zone < 0.8) {
        px = (u - 0.5) * W * 1.4;
        py = -T * 0.9 + v * T * 0.85;
      } else {
        px = (u - 0.5) * coatLen * 0.6;
        py = v * Math.max(coatLen, 0.3 * hu);
      }
      dots.push(<circle key={i} cx={px} cy={py} r={(0.012 + random(`${seed}-ash-r${i}`) * 0.018) * hu} fill={c('#8D8F8A')} opacity={0.8} />);
    }
    return <g>{dots}</g>;
  };
  const ashHead = () => {
    if (ash <= 0 || lod === 0 || rimFill) return null;
    const n = Math.round(ash * 18);
    return (
      <g>
        {Array.from({length: n}).map((_, i) => {
          const a = Math.PI + random(`${seed}-ah${i}`) * Math.PI;
          const rr = R * (0.7 + random(`${seed}-ahr${i}`) * 0.28);
          return <circle key={i} cx={Math.cos(a) * rr} cy={Math.sin(a) * rr} r={R * (0.02 + random(`${seed}-ahs${i}`) * 0.025)} fill={c('#8D8F8A')} opacity={0.85} />;
        })}
      </g>
    );
  };

  // --- голова целиком
  const kh: Ctx = {...k, h};
  const headG = (
    <g transform={`translate(${headFwd},${headY - shrug * 0.4}) rotate(${pose.headTilt ?? 0})`}>
      {slots.headBack ? slots.headBack(kh) : null}
      <circle cx={0} cy={0} r={R} fill={c(spec.skin)} />
      {lod > 0 ? <path d={crescent(0, 0, R, 30, 0.3)} fill={c(spec.skinShade)} /> : null}
      {lod > 1 ? <path d={crescent(0, 0, R, -140, 0.12)} fill={c(mix(spec.skin, '#ffffff', 0.18))} opacity={0.55} /> : null}
      {renderFace()}
      {slots.head ? slots.head(kh) : null}
      {ashHead()}
    </g>
  );

  const neck = (
    <g>
      <rect x={-neckW / 2 + headFwd * 0.5} y={-T - neckH - 0.05 * hu + headDrop * 0.3} width={neckW} height={neckH + 0.12 * hu} fill={c(spec.skinShade)} />
    </g>
  );

  const torsoG = (
    <g transform={`rotate(${lean}) scale(1,${breath})`}>
      {slots.behind ? slots.behind(k) : null}
      {!side ? <Arm which="R" s={1} far /> : null}
      {neck}
      <path d={torsoPath()} fill={c(top)} />
      {lod > 0 ? (
        <path
          d={`M${S * 0.18},${-T - shrug * 0.6} L${S * 0.3},${-T - shrug * 0.6} Q${S * 0.44},${-T - shrug * 0.6} ${S / 2},${-T - shrug * 0.6 + 0.24 * hu} L${W / 2},0 L${W * 0.22},0 Z`}
          fill={c(topShade)}
          opacity={0.85}
        />
      ) : null}
      {lod > 1 && spec.topHi ? <path d={`M${-S / 2 + aw * 0.5},${-T + aw * 0.3} L${-S * 0.22},${-T + aw * 0.2} L${-W * 0.3},${-T * 0.3} L${-W * 0.45},${-T * 0.3} Z`} fill={c(spec.topHi)} opacity={0.6} /> : null}
      {slots.torso ? slots.torso(k, geo) : null}
      {headG}
      {slots.over ? slots.over(k, geo) : null}
      {side ? (
        <>
          <Arm which="L" s={1} />
          <Arm which="R" s={-1} />
        </>
      ) : null}
      {ashDots()}
    </g>
  );

  const sitSide = pose.sit && !side;
  return (
    <g transform={`translate(0,${(pose.rootDy ?? 0) * hu}) rotate(${(pose.rootRot ?? 0) + sway})`}>
      <g transform={`translate(0,${hipY})`}>
        {side ? (
          <>
            <Leg which="L" s={1} />
            <Leg which="R" s={-1} />
          </>
        ) : (
          <Leg which="R" s={1} far />
        )}
        {!sitSide ? skirt() : null}
        {!side ? <Leg which="L" s={1} /> : null}
        {sitSide ? skirt() : null}
        {slots.skirt ? slots.skirt(k, geo) : null}
        {torsoG}
        {!side ? (
          <g transform={`rotate(${lean}) scale(1,${breath})`}>
            <Arm which="L" s={1} />
          </g>
        ) : null}
      </g>
    </g>
  );
};

/** Щебень во рту: 8–12 угловатых многоугольников, частично за линией губ. */
export const Gravel: React.FC<{cx: number; cy: number; R: number; seed: string; c: (s: string) => string; nostrils?: boolean}> = ({
  cx,
  cy,
  R,
  seed,
  c,
  nostrils = true,
}) => {
  const cols = ['#5E605C', '#7A7C77', '#46484A'];
  const stones: React.ReactNode[] = [];
  const n = 11;
  for (let i = 0; i < n; i++) {
    const px = cx + (random(`${seed}x${i}`) - 0.5) * R * 0.42;
    const py = cy + (random(`${seed}y${i}`) - 0.5) * R * 0.22;
    const sz = R * (0.05 + random(`${seed}s${i}`) * 0.06);
    const pts = Array.from({length: 5}).map((_, j) => {
      const a = (j / 5) * Math.PI * 2 + random(`${seed}a${i}${j}`) * 0.8;
      const r = sz * (0.6 + random(`${seed}r${i}${j}`) * 0.5);
      return `${(px + Math.cos(a) * r).toFixed(1)},${(py + Math.sin(a) * r).toFixed(1)}`;
    });
    stones.push(<polygon key={i} points={pts.join(' ')} fill={c(cols[i % 3])} />);
  }
  return (
    <g>
      <ellipse cx={cx} cy={cy} rx={R * 0.24} ry={R * 0.14} fill="#100b0a" />
      {stones}
      {nostrils ? (
        <g>
          <polygon points={`${cx - R * 0.08},${cy - R * 0.2} ${cx - R * 0.02},${cy - R * 0.25} ${cx - R * 0.01},${cy - R * 0.17}`} fill={c(cols[0])} />
          <polygon points={`${cx + R * 0.02},${cy - R * 0.24} ${cx + R * 0.08},${cy - R * 0.21} ${cx + R * 0.05},${cy - R * 0.16}`} fill={c(cols[1])} />
        </g>
      ) : null}
    </g>
  );
};

/** Готовые позы (углы в соглашениях рига). */
export const POSES = {
  stand: {} as Pose,
  standFront: {armL: [6, 4], armR: [6, 4]} as Pose,
  sitFront: {hipDrop: 1.05, thighScale: 0.32, legL: [4, 0], legR: [4, 0], armL: [4, 30], armR: [4, 30], sit: true} as Pose,
  sitSide: {hipDrop: 1.5, legL: [86, 86], legR: [80, 84], armL: [18, 50], armR: [14, 55], sit: true} as Pose,
  sitSlumped: {hipDrop: 1.55, legL: [70, 60], legR: [64, 66], lean: 14, headTilt: 12, headDrop: 0.1, armL: [8, 30], armR: [4, 40], sit: true} as Pose,
};

/** Цикл шага: phase 0..1 */
export const walkPose = (t: number, amp = 1, base: Pose = {}): Pose => {
  const s = Math.sin(t * Math.PI * 2);
  const c2 = Math.cos(t * Math.PI * 2);
  return {
    ...base,
    legL: [s * 24 * amp, Math.max(0, -c2) * 30 * amp + 4],
    legR: [-s * 24 * amp, Math.max(0, c2) * 30 * amp + 4],
    armL: [-s * 16 * amp + (base.armL?.[0] ?? 0), 14 + (base.armL?.[1] ?? 0)],
    armR: [s * 16 * amp + (base.armR?.[0] ?? 0), 14 + (base.armR?.[1] ?? 0)],
    rootDy: -Math.abs(c2) * 0.04 * amp,
  };
};
