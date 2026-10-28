import React from 'react';
import {random} from 'remotion';
import {mix} from '../../lib/color';
import {fogAt, makeProjector, PCam, Projector} from '../../lib/persp';
import {LIGHT_FN} from '../Characters/Rig';
import {Halation} from '../FX/Halation';

export type SetLight = 'warm' | 'emergency' | 'dark' | 'flashlight';

/** Цвет декорации с учётом света и общего уровня ламп (мерцание). */
export const setMapper = (light: SetLight, lamp = 1) => {
  const f = LIGHT_FN[light];
  return (c: string) => (lamp >= 0.999 ? f(c) : mix(f(c), '#000000', 1 - Math.max(0, lamp)));
};

// Палитра вагона (до катастрофы, тёплые лампы)
export const CAR = {
  ceiling: '#bdb6a2',
  lampStrip: '#F4E6C2',
  adStrip: '#a59d8a',
  ad: '#5b5850',
  wall: '#857d6b',
  wallLow: '#6f6858',
  glass: '#0b0f10',
  frame: '#4a4740',
  seal: '#2a2826',
  seatBack: '#3a4a54',
  seatBackShade: '#2d3a42',
  seat: '#455761',
  seatFront: '#2a2d2e',
  under: '#151615',
  floor: '#3b3833',
  floorStripe: '#2d2a26',
  door: '#9a917e',
  doorShade: '#7d7564',
  pole: '#b8b4a8',
  poleShade: '#7c7a72',
  handrail: '#9c988c',
  strap: '#2a2a28',
};

// --- ВИД СБОКУ: напротив сиденья и окна ---------------------------------------------------------

const BAY = 960;
const BAY_X0 = -960;
const BAYS = 5;
export type Rect = {x: number; y: number; w: number; h: number};

/** Окна стены (в дизайн-координатах слоя). */
export const carWindows = (): Rect[] => {
  const out: Rect[] = [];
  for (let b = 0; b < BAYS; b++) {
    const bx = BAY_X0 + b * BAY;
    out.push({x: bx + 40, y: 290, w: 300, h: 210});
    out.push({x: bx + 360, y: 290, w: 300, h: 210});
    out.push({x: bx + 722, y: 300, w: 96, h: 240});
    out.push({x: bx + 842, y: 300, w: 96, h: 240});
  }
  return out;
};
/** Окна над сиденьями (без дверных). */
export const benchWindows = () => carWindows().filter((w) => w.w > 200);
/** Центры мест на скамейках (x), для рассадки пассажиров. */
export const seatXs = (): number[] => {
  const xs: number[] = [];
  for (let b = 0; b < BAYS; b++) {
    const bx = BAY_X0 + b * BAY;
    for (let s = 0; s < 5; s++) xs.push(bx + 80 + s * 135);
  }
  return xs;
};
export const SEAT_Y = 712; // уровень ступней сидящих (пол у скамьи)
export const FLOOR_Y = 790;

/** Туннель за окнами (дальний план). motion 0..1 — поезд едет. */
export const CarOutside: React.FC<{frame: number; motion: number; light: SetLight; seed?: string; children?: React.ReactNode}> = ({
  frame,
  motion,
  light,
  seed = 'out',
  children,
}) => {
  const c = setMapper(light === 'warm' ? 'dark' : light);
  const speed = 95 * motion;
  const off = frame * speed;
  const W = 4200;
  const cables: React.ReactNode[] = [];
  const ys = [318, 336, 352, 372, 455, 470];
  ys.forEach((y, i) => {
    const segL = 600 + random(`${seed}-cl${i}`) * 900;
    const gap = 40 + random(`${seed}-cg${i}`) * 120;
    const period = segL + gap;
    const o = ((off * (0.95 + i * 0.02)) % period + period) % period;
    for (let k = -2; k < W / period + 2; k++) {
      const x = -1200 + k * period - o;
      cables.push(<rect key={`${i}-${k}`} x={x} y={y} width={segL} height={i < 4 ? 4 : 9} fill={c(i < 4 ? '#3a3f3e' : '#2a2f2e')} opacity={0.9} />);
    }
  });
  // проносящиеся огни туннеля
  const lamps: React.ReactNode[] = [];
  if (motion > 0.05) {
    const period = 1700;
    const o = (off * 1.0) % period;
    for (let k = -1; k < 4; k++) {
      const x = -1000 + k * period - o;
      lamps.push(
        <g key={k}>
          <rect x={x} y={402} width={160 + speed * 2} height={10} rx={5} fill="#e9d9a8" opacity={0.75} />
          <ellipse cx={x + 80 + speed} cy={407} rx={220 + speed * 2} ry={60} fill="#e9d9a8" opacity={0.08} />
        </g>,
      );
    }
  }
  return (
    <svg width={1920} height={1080} viewBox="0 0 1920 1080" style={{position: 'absolute', left: 0, top: 0, overflow: 'visible'}}>
      <rect x={-1500} y={-200} width={5000} height={1500} fill={c('#0a0c0c')} />
      <rect x={-1500} y={300} width={5000} height={200} fill={c('#121514')} />
      {/* тюбинги — вертикальные рёбра, мелькают */}
      {Array.from({length: 40}).map((_, i) => {
        const p = 110;
        const x = -1400 + (((i * p - off * 1.05) % (40 * p)) + 40 * p) % (40 * p);
        return <rect key={i} x={x} y={260} width={motion > 0.3 ? 30 + speed * 0.6 : 18} height={300} fill={c('#1a1e1d')} opacity={0.7} />;
      })}
      {cables}
      {lamps}
      {children}
    </svg>
  );
};

/** Стена вагона: потолок, лампы, рекламная полоса, окна, скамьи, двери, пол. */
export const CarWall: React.FC<{
  light: SetLight;
  lamp?: number;
  frame?: number;
  id: string;
  dirt?: number;
  glass?: (w: Rect, i: number) => React.ReactNode;
  emergencyLamp?: number | number[]; // яркость красных аварийных ламп 0..1 (можно по секциям)
  coatsOnFloor?: boolean;
}> = ({light, lamp = 1, id, dirt = 0, glass, emergencyLamp: emIn = 0, coatsOnFloor = false}) => {
  const emAt = (b: number) => (Array.isArray(emIn) ? emIn[b] ?? 0 : emIn);
  const emergencyLamp = Array.isArray(emIn) ? Math.max(...emIn) : emIn;
  const c = setMapper(light, lamp);
  const wins = carWindows();
  const X0 = BAY_X0 - 200;
  const X1 = BAY_X0 + BAYS * BAY + 200;
  const holes = wins.map((w) => `M${w.x},${w.y + 14} q0,-14 14,-14 h${w.w - 28} q14,0 14,14 v${w.h - 28} q0,14 -14,14 h${-(w.w - 28)} q-14,0 -14,-14 Z`).join(' ');
  const wallPath = `M${X0},150 H${X1} V${FLOOR_Y} H${X0} Z ${holes}`;
  const warm = light === 'warm';
  const els: React.ReactNode[] = [];
  // потолок и световая полоса
  els.push(<rect key="ceil" x={X0} y={-300} width={X1 - X0} height={460} fill={c(CAR.ceiling)} />);
  els.push(<rect key="ceil2" x={X0} y={110} width={X1 - X0} height={40} fill={c('#a8a190')} />);
  els.push(<rect key="lamp" x={X0} y={128} width={X1 - X0} height={22} fill={warm ? mix(CAR.lampStrip, '#000', 1 - lamp) : c('#55524a')} />);
  // стена с отверстиями окон
  els.push(<path key="wall" d={wallPath} fill={c(CAR.wall)} fillRule="evenodd" />);
  // нижняя часть стены темнее
  els.push(<rect key="wlow" x={X0} y={520} width={X1 - X0} height={FLOOR_Y - 520} fill={c(CAR.wallLow)} />);
  // рекламная полоса
  els.push(<rect key="ads" x={X0} y={196} width={X1 - X0} height={66} fill={c(CAR.adStrip)} />);
  for (let b = 0; b < BAYS; b++) {
    const bx = BAY_X0 + b * BAY;
    els.push(<rect key={`ad${b}a`} x={bx + 50} y={204} width={280} height={50} fill={c(CAR.ad)} />);
    els.push(<rect key={`ad${b}b`} x={bx + 370} y={204} width={280} height={50} fill={c(mix(CAR.ad, '#6a5040', 0.3))} />);
    // схема линии (без названий)
    els.push(<rect key={`ln${b}`} x={bx + 380} y={226} width={260} height={4} fill={c('#7a2a22')} />);
    for (let k = 0; k < 7; k++) els.push(<circle key={`st${b}-${k}`} cx={bx + 390 + k * 40} cy={228} r={6} fill={c('#d9d2bf')} />);
    // двери
    els.push(<rect key={`door${b}`} x={bx + 706} y={262} width={248} height={FLOOR_Y - 262} fill={c(CAR.door)} />);
    els.push(<rect key={`doorS${b}`} x={bx + 830} y={262} width={124} height={FLOOR_Y - 262} fill={c(CAR.doorShade)} />);
    els.push(<rect key={`gap${b}`} x={bx + 828} y={262} width={4} height={FLOOR_Y - 262} fill={c('#1a1a18')} />);
    els.push(<rect key={`dst${b}`} x={bx + 706} y={FLOOR_Y - 26} width={248} height={10} fill={c('#7a6a2a')} />);
    // скамья: спинка, сиденье, фасад
    els.push(<rect key={`bb${b}`} x={bx + 20} y={528} width={666} height={128} rx={14} fill={c(CAR.seatBack)} />);
    els.push(<rect key={`bbs${b}`} x={bx + 20} y={600} width={666} height={56} fill={c(CAR.seatBackShade)} />);
    for (let s = 1; s < 5; s++) els.push(<rect key={`sd${b}-${s}`} x={bx + 20 + s * 133} y={534} width={3} height={118} fill={c('#2a363c')} />);
    els.push(<rect key={`seat${b}`} x={bx + 14} y={652} width={678} height={44} rx={12} fill={c(CAR.seat)} />);
    els.push(<rect key={`sf${b}`} x={bx + 24} y={694} width={658} height={60} fill={c(CAR.seatFront)} />);
    els.push(<rect key={`ar${b}`} x={bx + 4} y={520} width={18} height={180} rx={8} fill={c(CAR.pole)} />);
    els.push(<rect key={`ar2${b}`} x={bx + 686} y={520} width={18} height={180} rx={8} fill={c(CAR.pole)} />);
    // аварийная лампа над дверью
    els.push(<rect key={`el${b}`} x={bx + 800} y={160} width={60} height={26} rx={6} fill={emAt(b) > 0 ? mix('#3a0806', '#E04030', emAt(b)) : c('#5a2a26')} />);
  }
  // оконные рамы и уплотнители, отражения
  wins.forEach((w, i) => {
    els.push(
      <path
        key={`fr${i}`}
        d={`M${w.x - 6},${w.y - 6} h${w.w + 12} v${w.h + 12} h${-(w.w + 12)} Z M${w.x + 2},${w.y + 14} q0,-12 12,-12 h${w.w - 28} q12,0 12,12 v${w.h - 28} q0,12 -12,12 h${-(w.w - 28)} q-12,0 -12,-12 Z`}
        fill={c(CAR.seal)}
        fillRule="evenodd"
      />,
    );
    if (warm) {
      // слабое отражение салона в стекле
      els.push(<path key={`rf${i}`} d={`M${w.x + w.w * 0.1},${w.y + w.h} L${w.x + w.w * 0.45},${w.y} L${w.x + w.w * 0.62},${w.y} L${w.x + w.w * 0.27},${w.y + w.h} Z`} fill="#fff" opacity={0.045 * lamp} />);
    }
    if (glass) els.push(<g key={`gl${i}`}>{glass(w, i)}</g>);
  });
  // пол
  els.push(<rect key="floor" x={X0} y={FLOOR_Y} width={X1 - X0} height={600} fill={c(CAR.floor)} />);
  els.push(<rect key="fl2" x={X0} y={FLOOR_Y} width={X1 - X0} height={14} fill={c('#24221f')} />);
  for (let i = 0; i < 6; i++) els.push(<rect key={`fs${i}`} x={X0} y={FLOOR_Y + 60 + i * 70} width={X1 - X0} height={6} fill={c(CAR.floorStripe)} />);
  // грязь и следы (серии 2+)
  if (dirt > 0) {
    for (let i = 0; i < Math.round(dirt * 40); i++) {
      const x = X0 + random(`${id}-d${i}`) * (X1 - X0);
      const y = FLOOR_Y + 20 + random(`${id}-dy${i}`) * 200;
      els.push(<ellipse key={`dt${i}`} cx={x} cy={y} rx={30 + random(`${id}-dr${i}`) * 70} ry={8 + random(`${id}-drr${i}`) * 14} fill={c('#1f1c19')} opacity={0.5} />);
    }
  }
  if (coatsOnFloor) {
    for (let i = 0; i < 6; i++) {
      const x = BAY_X0 + 250 + i * 520 + random(`${id}-co${i}`) * 100;
      const col = ['#3e3a44', '#4a4e43', '#3a3631', '#5a4f48', '#2f3436', '#4E4A52'][i];
      els.push(<path key={`coat${i}`} d={`M${x},${FLOOR_Y + 90} q60,-40 160,-20 q90,10 120,50 q-40,40 -160,36 q-100,-4 -120,-66 Z`} fill={c(col)} />);
    }
  }
  // затенение сверху вниз — свет ламп с потолка
  els.push(
    <defs key="defs">
      <linearGradient id={`${id}-shade`} x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#000" stopOpacity={0} />
        <stop offset="55%" stopColor="#000" stopOpacity={warm ? 0.12 : 0.25} />
        <stop offset="100%" stopColor="#000" stopOpacity={warm ? 0.45 : 0.6} />
      </linearGradient>
    </defs>,
  );
  els.push(<rect key="shade" x={X0} y={150} width={X1 - X0} height={1000} fill={`url(#${id}-shade)`} />);
  // поручень и петли
  els.push(<rect key="rail" x={X0} y={272} width={X1 - X0} height={10} rx={5} fill={c(CAR.handrail)} />);
  return (
    <svg width={1920} height={1080} viewBox="0 0 1920 1080" style={{position: 'absolute', left: 0, top: 0, overflow: 'visible'}}>
      {els}
      {warm ? (
        <Halation
          id={`${id}-hal`}
          intensity={lamp}
          glows={Array.from({length: 7}).map((_, i) => ({x: -400 + i * 480, y: 150, r: 260, rx: 420, ry: 120, color: '#F4E6C2', a: 0.35}))}
        />
      ) : null}
      {emergencyLamp > 0 ? (
        <Halation
          id={`${id}-eh`}
          intensity={1}
          glows={Array.from({length: BAYS}).map((_, b) => ({x: BAY_X0 + b * BAY + 830, y: 175, r: 300, rx: 420, ry: 300, color: '#B3261E', a: 0.55 * emAt(b)}))}
        />
      ) : null}
    </svg>
  );
};

/** Передний план: вертикальные поручни (размыты, быстрый параллакс). */
export const CarPoles: React.FC<{light: SetLight; lamp?: number; xs?: number[]}> = ({light, lamp = 1, xs = [-260, 980, 2140]}) => {
  const c = setMapper(light, lamp);
  return (
    <svg width={1920} height={1080} viewBox="0 0 1920 1080" style={{position: 'absolute', left: 0, top: 0, overflow: 'visible'}}>
      {xs.map((x, i) => (
        <g key={i}>
          <rect x={x} y={-300} width={46} height={1700} fill={c(CAR.poleShade)} />
          <rect x={x + 6} y={-300} width={16} height={1700} fill={c(CAR.pole)} />
          <rect x={x + 10} y={-300} width={5} height={1700} fill={light === 'warm' ? '#f4ead0' : c('#d0ccc0')} opacity={0.7} />
        </g>
      ))}
    </svg>
  );
};

// --- ВИД ВДОЛЬ ВАГОНА (перспектива) --------------------------------------------------------------

export type CorridorItem = {z: number; render: (pr: Projector) => React.ReactNode};

const HW = 1.42; // полуширина салона
const FLOOR = 1.6; // y пола (глаза стоящего на 0)
const CEIL = -0.68;
const SEAT_TOP = 1.13;
const SEAT_IN = 0.92; // кромка сиденья (|x|)
const BACK_TOP = 0.5;
const WIN_TOP = -0.3;
const WIN_BOT = 0.42;
export const CAR_LEN = 18;
export const DOORS: [number, number][] = [
  [3.6, 4.9],
  [9.2, 10.5],
  [14.8, 16.1],
];
const inDoor = (z: number) => DOORS.some(([a, b]) => z > a && z < b);

/** Положение сидящего на скамейке в перспективе: сторона −1/+1, глубина z. */
export const corridorSeat = (side: -1 | 1, z: number) => ({x: side * 1.12, y: FLOOR, z});
export const CORRIDOR = {HW, FLOOR, CEIL, SEAT_TOP, SEAT_IN};

export const CarCorridor: React.FC<{
  pcam: PCam;
  light: SetLight;
  lamp?: number;
  id: string;
  items?: CorridorItem[];
  fog?: string;
  fogStart?: number;
  fogEnd?: number;
  emergencyLamp?: number;
  endWindow?: (rect: {x: number; y: number; w: number; h: number}, pr: Projector) => React.ReactNode;
  wetSeat?: {side: -1 | 1; z: number; a: number};
  windowGlass?: (quad: string, side: number, z0: number, z1: number, pr: Projector) => React.ReactNode;
}> = ({pcam, light, lamp = 1, id, items = [], fog = '#07090A', fogStart = 3, fogEnd = 26, emergencyLamp = 0, endWindow, wetSeat, windowGlass}) => {
  const pr = makeProjector(pcam);
  const base = setMapper(light, lamp);
  const warm = light === 'warm';
  const fogC = warm ? '#2a241a' : fog;
  const col = (c: string, z: number) => mix(base(c), fogC, fogAt(pr.depth(z), fogStart, fogEnd));
  const draw: {z: number; node: React.ReactNode}[] = [];
  // салон всегда продолжается за камерой: стены доходят до края кадра
  const zNear = pcam.z + 0.15;
  const step = 0.6;

  // торцевая стена с дверью в кабину
  const endZ = CAR_LEN;
  const endNode = (
    <g key="end">
      <polygon points={pr.poly([[-HW, CEIL, endZ], [HW, CEIL, endZ], [HW, FLOOR, endZ], [-HW, FLOOR, endZ]])} fill={col(CAR.wall, endZ)} />
      <polygon points={pr.poly([[-0.42, -0.45, endZ], [0.42, -0.45, endZ], [0.42, FLOOR, endZ], [-0.42, FLOOR, endZ]])} fill={col(CAR.door, endZ)} />
      <polygon points={pr.poly([[-0.3, -0.3, endZ], [0.3, -0.3, endZ], [0.3, 0.35, endZ], [-0.3, 0.35, endZ]])} fill={col('#0b0f10', endZ)} />
    </g>
  );
  draw.push({z: endZ + 0.01, node: endNode});
  if (endWindow) {
    const [x0, y0] = pr.P(-0.3, -0.3, endZ);
    const [x1, y1] = pr.P(0.3, 0.35, endZ);
    draw.push({z: endZ, node: <g key="endw">{endWindow({x: x0, y: y0, w: x1 - x0, h: y1 - y0}, pr)}</g>});
  }

  // поверхности: полосы по глубине
  for (let z1 = endZ; z1 > zNear; z1 -= step) {
    const z0 = Math.max(zNear, z1 - step);
    const zm = (z0 + z1) / 2;
    const nodes: React.ReactNode[] = [];
    // потолок
    nodes.push(<polygon key="c" points={pr.poly([[-HW, CEIL, z0], [HW, CEIL, z0], [HW, CEIL, z1], [-HW, CEIL, z1]])} fill={col(CAR.ceiling, zm)} />);
    // световые полосы
    for (const sx of [-0.55, 0.55]) {
      nodes.push(
        <polygon
          key={`l${sx}`}
          points={pr.poly([[sx - 0.09, CEIL + 0.01, z0], [sx + 0.09, CEIL + 0.01, z0], [sx + 0.09, CEIL + 0.01, z1], [sx - 0.09, CEIL + 0.01, z1]])}
          fill={warm ? mix(mix(CAR.lampStrip, '#000', 1 - lamp), fogC, fogAt(pr.depth(zm), fogStart, fogEnd) * 0.6) : col('#55524a', zm)}
        />,
      );
    }
    // пол
    nodes.push(<polygon key="f" points={pr.poly([[-HW, FLOOR, z0], [HW, FLOOR, z0], [HW, FLOOR, z1], [-HW, FLOOR, z1]])} fill={col(Math.floor(zm / 1.2) % 2 ? CAR.floor : '#37342f', zm)} />);
    for (const sd of [-1, 1]) {
      const door = inDoor(zm);
      // стена
      nodes.push(
        <polygon key={`w${sd}`} points={pr.poly([[sd * HW, CEIL, z0], [sd * HW, CEIL, z1], [sd * HW, FLOOR, z1], [sd * HW, FLOOR, z0]])} fill={col(door ? CAR.door : CAR.wall, zm)} />,
      );
      // рекламная полоса
      nodes.push(<polygon key={`a${sd}`} points={pr.poly([[sd * HW, -0.6, z0], [sd * HW, -0.6, z1], [sd * HW, -0.38, z1], [sd * HW, -0.38, z0]])} fill={col(CAR.adStrip, zm)} />);
      // окна
      if (!door || true) {
        const wt = door ? -0.25 : WIN_TOP;
        const wb = door ? 0.62 : WIN_BOT;
        const quad = pr.poly([[sd * HW, wt, z0 + 0.04], [sd * HW, wt, z1 - 0.04], [sd * HW, wb, z1 - 0.04], [sd * HW, wb, z0 + 0.04]]);
        nodes.push(<polygon key={`g${sd}`} points={quad} fill={col(CAR.glass, zm)} />);
        if (windowGlass) nodes.push(<g key={`wg${sd}`}>{windowGlass(quad, sd, z0, z1, pr)}</g>);
      }
      // нижняя часть стены
      if (!door) nodes.push(<polygon key={`lw${sd}`} points={pr.poly([[sd * HW, WIN_BOT + 0.02, z0], [sd * HW, WIN_BOT + 0.02, z1], [sd * HW, FLOOR, z1], [sd * HW, FLOOR, z0]])} fill={col(CAR.wallLow, zm)} />);
    }
    draw.push({z: z1, node: <g key={`s${z1.toFixed(2)}`}>{nodes}</g>});
  }

  // скамьи (рисуются отрезками, чтобы перекрываться с людьми правильно)
  for (const sd of [-1, 1] as const) {
    for (let z1 = endZ - 0.2; z1 > zNear; z1 -= 0.5) {
      const z0 = Math.max(zNear, z1 - 0.5);
      const zm = (z0 + z1) / 2;
      if (inDoor(zm)) continue;
      const nodes: React.ReactNode[] = [];
      // спинка
      nodes.push(<polygon key="b" points={pr.poly([[sd * (HW - 0.04), BACK_TOP, z0], [sd * (HW - 0.04), BACK_TOP, z1], [sd * (HW - 0.12), SEAT_TOP, z1], [sd * (HW - 0.12), SEAT_TOP, z0]])} fill={col(CAR.seatBack, zm)} />);
      // сиденье (верх)
      nodes.push(<polygon key="t" points={pr.poly([[sd * (HW - 0.12), SEAT_TOP, z0], [sd * (HW - 0.12), SEAT_TOP, z1], [sd * SEAT_IN, SEAT_TOP, z1], [sd * SEAT_IN, SEAT_TOP, z0]])} fill={col(CAR.seat, zm)} />);
      // фасад
      nodes.push(<polygon key="fr" points={pr.poly([[sd * SEAT_IN, SEAT_TOP, z0], [sd * SEAT_IN, SEAT_TOP, z1], [sd * SEAT_IN, FLOOR, z1], [sd * SEAT_IN, FLOOR, z0]])} fill={col(CAR.seatFront, zm)} />);
      if (wetSeat && wetSeat.side === sd && Math.abs(zm - wetSeat.z) < 0.3 && wetSeat.a > 0) {
        nodes.push(
          <polygon
            key="wet"
            points={pr.poly([[sd * (HW - 0.14), SEAT_TOP - 0.005, z0 + 0.05], [sd * (HW - 0.14), SEAT_TOP - 0.005, z1 - 0.05], [sd * (SEAT_IN + 0.03), SEAT_TOP - 0.005, z1 - 0.1], [sd * (SEAT_IN + 0.03), SEAT_TOP - 0.005, z0 + 0.1]])}
            fill="#0a0d0e"
            opacity={0.8 * wetSeat.a}
          />,
        );
        nodes.push(
          <polygon
            key="wet2"
            points={pr.poly([[sd * (HW - 0.2), SEAT_TOP - 0.008, z0 + 0.15], [sd * (HW - 0.2), SEAT_TOP - 0.008, z0 + 0.25], [sd * (SEAT_IN + 0.08), SEAT_TOP - 0.008, z0 + 0.3], [sd * (SEAT_IN + 0.08), SEAT_TOP - 0.008, z0 + 0.2]])}
            fill="#9fb0b2"
            opacity={0.35 * wetSeat.a}
          />,
        );
      }
      draw.push({z: z1 - 0.001, node: <g key={`bn${sd}-${z1.toFixed(2)}`}>{nodes}</g>});
    }
  }

  // вертикальные поручни у дверей и аварийные лампы
  DOORS.forEach(([a, b], i) => {
    for (const zz of [a - 0.1, b + 0.1]) {
      if (zz < zNear + 0.1) continue;
      for (const sx of [-0.78, 0.78]) {
        const [x0, y0] = pr.P(sx, CEIL, zz);
        const [, y1] = pr.P(sx, FLOOR, zz);
        const w = Math.max(1.5, pr.scaleAt(zz) * 0.04);
        draw.push({
          z: zz,
          node: <rect key={`pole${i}-${zz}-${sx}`} x={x0 - w / 2} y={y0} width={w} height={y1 - y0} fill={col(CAR.pole, zz)} />,
        });
      }
    }
    if (emergencyLamp > 0) {
      const zz = (a + b) / 2;
      if (zz > zNear + 0.2) {
        const [ex, ey] = pr.P(0, CEIL + 0.02, zz);
        const s = pr.scaleAt(zz);
        draw.push({
          z: zz,
          node: (
            <g key={`el${i}`}>
              <rect x={ex - s * 0.16} y={ey} width={s * 0.32} height={s * 0.08} fill={mix('#3a0806', '#E04030', emergencyLamp)} />
              <ellipse cx={ex} cy={ey + s * 0.1} rx={s * 0.9} ry={s * 0.6} fill="#B3261E" opacity={0.18 * emergencyLamp} />
            </g>
          ),
        });
      }
    }
  });

  for (const it of items) draw.push({z: it.z, node: <g key={`it${it.z}-${draw.length}`}>{it.render(pr)}</g>});
  draw.sort((a, b) => b.z - a.z);
  return (
    <svg width={1920} height={1080} viewBox="0 0 1920 1080" style={{position: 'absolute', left: 0, top: 0, overflow: 'visible'}}>
      <rect x={-500} y={-500} width={2920} height={2080} fill={col(CAR.wall, endZ)} />
      {draw.map((d) => d.node)}
      {warm ? (
        <Halation
          id={`${id}-ch`}
          intensity={lamp * 0.8}
          glows={[2, 5, 9, 14].map((z) => {
            const [x, y] = pr.P(0, CEIL, z);
            return {x, y, r: pr.scaleAt(z) * 0.9, rx: pr.scaleAt(z) * 1.6, ry: pr.scaleAt(z) * 0.5, color: '#F4E6C2', a: 0.25};
          })}
        />
      ) : null}
    </svg>
  );
};
