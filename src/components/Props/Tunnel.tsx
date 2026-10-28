import React from 'react';
import {random} from 'remotion';
import {mix} from '../../lib/color';
import {FONT_MONO} from '../../lib/fonts';
import {fogAt, makeProjector, PCam, Projector} from '../../lib/persp';
import {setMapper, SetLight} from './MetroCar';

/**
 * Туннель перегона в перспективе: тюбинги-кольца, рельсы сходятся в точку, кабели,
 * боковой проход «ВШ-12», гермозатвор в конце. Видно в основном то, что попадает в луч.
 */
export type TunnelItem = {z: number; render: (pr: Projector) => React.ReactNode};

export const TUN = {R: 2.75, CY: -0.15, FLOOR: 1.55, RAIL: 0.76};

const circleX = (y: number) => Math.sqrt(Math.max(0, TUN.R * TUN.R - (y - TUN.CY) * (y - TUN.CY)));

export const Tunnel: React.FC<{
  pcam: PCam;
  light: SetLight;
  lamp?: number;
  id: string;
  items?: TunnelItem[];
  zFar?: number;
  passageZ?: number | null; // начало бокового прохода ВШ-12 (слева)
  doorZ?: number | null; // гермозатвор
  doorScratches?: number; // 0..1
  fog?: string;
  fogStart?: number;
  fogEnd?: number;
  footprints?: {boots: number; bare: number}; // проявление следов в пыли 0..1
  glowTint?: string; // общий подсвет (например, красный строб)
  glowA?: number;
}> = ({
  pcam,
  light,
  lamp = 1,
  id,
  items = [],
  zFar = 60,
  passageZ = null,
  doorZ = null,
  doorScratches = 0,
  fog = '#050606',
  fogStart = 2,
  fogEnd = 34,
  footprints,
  glowTint,
  glowA = 0,
}) => {
  const pr = makeProjector(pcam);
  const base = setMapper(light, lamp);
  const tint = (c: string) => (glowTint && glowA > 0 ? mix(c, glowTint, glowA * 0.35) : c);
  const col = (c: string, z: number) => mix(tint(base(c)), fog, fogAt(pr.depth(z), fogStart, fogEnd));
  const zNear = Math.max(0.25, pcam.z + 0.2);
  const end = doorZ ?? zFar;
  const draw: {z: number; node: React.ReactNode}[] = [];
  const ringStep = 1.0;
  const circ = (z: number) => {
    const [cx, cy] = pr.P(0, TUN.CY, z);
    return {cx, cy, r: pr.scaleAt(z) * TUN.R};
  };
  const circlePath = (z: number, rev = false) => {
    const {cx, cy, r} = circ(z);
    return `M${cx - r},${cy} a${r},${r} 0 1,${rev ? 0 : 1} ${2 * r},0 a${r},${r} 0 1,${rev ? 0 : 1} ${-2 * r},0 Z`;
  };

  // дальний торец: гермозатвор или тьма
  if (doorZ !== null) {
    const z = doorZ;
    const s = pr.scaleAt(z);
    const [dx0, dy0] = pr.P(-1.9, -1.6, z);
    const [dx1, dy1] = pr.P(1.9, TUN.FLOOR, z);
    const ribs: React.ReactNode[] = [];
    for (let i = 0; i < 7; i++) {
      const y = dy0 + ((dy1 - dy0) * (i + 0.5)) / 7;
      ribs.push(<rect key={i} x={dx0 + s * 0.1} y={y - s * 0.04} width={dx1 - dx0 - s * 0.2} height={s * 0.08} fill={col('#2c3230', z)} />);
    }
    const rivets: React.ReactNode[] = [];
    for (let i = 0; i < 14; i++) {
      rivets.push(<circle key={`a${i}`} cx={dx0 + s * 0.12} cy={dy0 + ((dy1 - dy0) * i) / 13} r={s * 0.03} fill={col('#5a605c', z)} />);
      rivets.push(<circle key={`b${i}`} cx={dx1 - s * 0.12} cy={dy0 + ((dy1 - dy0) * i) / 13} r={s * 0.03} fill={col('#5a605c', z)} />);
    }
    const scr: React.ReactNode[] = [];
    if (doorScratches > 0) {
      // царапины ногтями на нижней части двери (с этой стороны)
      for (let i = 0; i < 26; i++) {
        const x = dx0 + (dx1 - dx0) * (0.25 + random(`${id}-sx${i}`) * 0.5);
        const y = dy1 - s * (0.3 + random(`${id}-sy${i}`) * 1.2);
        const l = s * (0.15 + random(`${id}-sl${i}`) * 0.35);
        scr.push(
          <line key={i} x1={x} y1={y} x2={x + (random(`${id}-sd${i}`) - 0.5) * s * 0.08} y2={y + l} stroke={col('#9aa29e', z)} strokeWidth={Math.max(1, s * 0.008)} opacity={doorScratches * 0.85} />,
        );
        if (i % 3 === 0) scr.push(<line key={`r${i}`} x1={x + s * 0.01} y1={y + l * 0.6} x2={x + s * 0.012} y2={y + l} stroke="#4a1410" strokeWidth={Math.max(1, s * 0.01)} opacity={doorScratches * 0.7} />);
      }
    }
    draw.push({
      z: z + 0.01,
      node: (
        <g key="door">
          <path d={circlePath(z)} fill={col('#1a1f1d', z)} />
          <rect x={dx0 - s * 0.25} y={dy0 - s * 0.25} width={dx1 - dx0 + s * 0.5} height={dy1 - dy0 + s * 0.25} fill={col('#2A302E', z)} />
          <rect x={dx0} y={dy0} width={dx1 - dx0} height={dy1 - dy0} fill={col('#3B4240', z)} />
          {ribs}
          {rivets}
          <rect x={(dx0 + dx1) / 2 - s * 0.6} y={dy0 + (dy1 - dy0) * 0.12} width={s * 1.2} height={s * 0.28} fill={col('#6a5a2a', z)} />
          <text x={(dx0 + dx1) / 2} y={dy0 + (dy1 - dy0) * 0.12 + s * 0.2} textAnchor="middle" fontFamily={FONT_MONO} fontSize={s * 0.16} fill={col('#1a1a14', z)}>
            ГЗ-3
          </text>
          {scr}
          {/* лучи ржавчины */}
          <rect x={dx0} y={dy1 - s * 0.08} width={dx1 - dx0} height={s * 0.08} fill={col('#2a2420', z)} />
        </g>
      ),
    });
  } else {
    draw.push({z: zFar + 1, node: <path key="far" d={circlePath(zFar)} fill={fog} />});
  }

  // кольца тюбингов от дальнего к ближнему
  for (let z1 = end; z1 > zNear; z1 -= ringStep) {
    const z0 = Math.max(zNear, z1 - ringStep);
    const zm = (z0 + z1) / 2;
    const odd = Math.floor(z1 / ringStep) % 2 === 0;
    const nodes: React.ReactNode[] = [];
    nodes.push(<path key="ring" d={`${circlePath(z0)} ${circlePath(z1, true)}`} fill={col(odd ? '#2A302E' : '#272d2b', zm)} fillRule="evenodd" />);
    // шов-ребро тюбинга
    const c0 = circ(z0);
    nodes.push(<circle key="seam" cx={c0.cx} cy={c0.cy} r={c0.r} fill="none" stroke={col('#1a1e1d', z0)} strokeWidth={Math.max(1, pr.scaleAt(z0) * 0.07)} />);
    // болты на шве (ближние кольца)
    if (pr.depth(z0) < 9) {
      for (let k = 0; k < 16; k++) {
        const a = Math.PI * (0.1 + (k / 16) * 0.8) + Math.PI;
        const yy = TUN.CY + Math.sin(a) * TUN.R * 0.97;
        const xx = Math.cos(a) * TUN.R * 0.97;
        const [bx, by] = pr.P(xx, yy, z0 + 0.02);
        nodes.push(<circle key={`bt${k}`} cx={bx} cy={by} r={Math.max(0.8, pr.scaleAt(z0) * 0.025)} fill={col('#4a504c', z0)} />);
      }
    }
    // кабели по правой стене
    for (const [ang, w, colr] of [
      [-0.12, 0.05, '#151817'],
      [-0.05, 0.04, '#1b1e1d'],
      [0.03, 0.06, '#121514'],
    ] as [number, number, string][]) {
      const a = ang * Math.PI;
      const xx = Math.cos(a) * TUN.R * 0.94;
      const yy = TUN.CY + Math.sin(a) * TUN.R * 0.94;
      const sag = 0.06;
      const [ax, ay] = pr.P(xx, yy, z0);
      const [bx2, by2] = pr.P(xx, yy, z1);
      const [mx, my] = pr.P(xx, yy + sag, zm);
      nodes.push(<path key={`cb${ang}`} d={`M${ax},${ay} Q${mx},${my + (my - (ay + by2) / 2)} ${bx2},${by2}`} stroke={col(colr, zm)} strokeWidth={Math.max(1, pr.scaleAt(zm) * w)} fill="none" />);
    }
    // пол (балласт) и шпалы
    const fx = circleX(TUN.FLOOR);
    nodes.push(<polygon key="floor" points={pr.poly([[-fx, TUN.FLOOR, z0], [fx, TUN.FLOOR, z0], [fx, TUN.FLOOR, z1], [-fx, TUN.FLOOR, z1]])} fill={col('#1f2321', zm)} />);
    for (const sz of [z0 + 0.15, z0 + 0.65]) {
      if (sz > z1) continue;
      nodes.push(<polygon key={`sl${sz}`} points={pr.poly([[-1.25, TUN.FLOOR, sz], [1.25, TUN.FLOOR, sz], [1.25, TUN.FLOOR, sz + 0.22], [-1.25, TUN.FLOOR, sz + 0.22]])} fill={col('#2a2622', sz)} />);
    }
    // лоток с водой у стены
    nodes.push(<polygon key="drain" points={pr.poly([[-fx, TUN.FLOOR, z0], [-fx + 0.35, TUN.FLOOR, z0], [-fx + 0.35, TUN.FLOOR, z1], [-fx, TUN.FLOOR, z1]])} fill={col('#101413', zm)} />);
    // рельсы
    for (const sx of [-TUN.RAIL, TUN.RAIL]) {
      nodes.push(
        <polygon
          key={`rl${sx}`}
          points={pr.poly([[sx - 0.04, TUN.FLOOR - 0.15, z0], [sx + 0.04, TUN.FLOOR - 0.15, z0], [sx + 0.04, TUN.FLOOR - 0.15, z1], [sx - 0.04, TUN.FLOOR - 0.15, z1]])}
          fill={col('#6a6e6a', zm)}
        />,
      );
      nodes.push(
        <polygon
          key={`rs${sx}`}
          points={pr.poly([[sx + 0.04, TUN.FLOOR - 0.15, z0], [sx + 0.04, TUN.FLOOR - 0.15, z1], [sx + 0.04, TUN.FLOOR, z1], [sx + 0.04, TUN.FLOOR, z0]])}
          fill={col('#2e302d', zm)}
        />,
      );
    }
    // следы в пыли (серия 2): ботинки к герме, босые — от ВШ-12 к поезду
    if (footprints && pr.depth(zm) < 16) {
      // пыльная полоса вдоль путей, на которой видны отпечатки
      nodes.push(<polygon key="dust" points={pr.poly([[-1.9, TUN.FLOOR - 0.004, z0], [0.95, TUN.FLOOR - 0.004, z0], [0.95, TUN.FLOOR - 0.004, z1], [-1.9, TUN.FLOOR - 0.004, z1]])} fill={col('#3a3e3a', zm)} />);
      const print = (x: number, z: number, len: number, w: number, key: string, a: number, toes: boolean) => {
        const [cx, cy] = pr.P(x, TUN.FLOOR - 0.006, z);
        const s = pr.scaleAt(z);
        const [, cy2] = pr.P(x, TUN.FLOOR - 0.006, z + len);
        const ry = Math.max(1, Math.abs(cy - cy2) / 2);
        nodes.push(<ellipse key={key} cx={cx} cy={(cy + cy2) / 2} rx={s * w} ry={ry} fill={col('#151817', z)} opacity={a} />);
        if (toes) {
          for (let t = 0; t < 4; t++) {
            nodes.push(<circle key={`${key}t${t}`} cx={cx + (t - 1.5) * s * w * 0.55} cy={(cy + cy2) / 2 - ry * 1.35} r={Math.max(0.8, s * w * 0.22)} fill={col('#151817', z)} opacity={a} />);
          }
        }
      };
      for (let k = 0; k < 2; k++) {
        const fz = z0 + k * 0.5 + 0.1;
        if (footprints.boots > 0) print(0.22 + (k % 2) * 0.2, fz, 0.28, 0.06, `fb${k}`, footprints.boots * 0.9, false);
        if (footprints.bare > 0 && passageZ !== null && fz < passageZ + 1.4) {
          const drift = Math.max(0, ((passageZ ?? 0) - fz) * 0.12);
          print(-1.55 + drift + (k % 2) * 0.18, fz + 0.2, 0.22, 0.05, `bf${k}`, footprints.bare * 0.9, true);
        }
      }
    }
    draw.push({z: z1, node: <g key={`r${z1.toFixed(2)}`}>{nodes}</g>});
  }

  // боковой проход ВШ-12 (слева) и табличка
  if (passageZ !== null) {
    const z0 = passageZ;
    const z1 = passageZ + 1.4;
    const top = -0.75;
    const px = -2.3;
    // проём — вертикальная плоскость, врезанная в изгиб стены, с бетонной рамой
    const frame: [number, number, number][] = [
      [px, top - 0.18, z0 - 0.15],
      [px, top - 0.18, z1 + 0.15],
      [px, TUN.FLOOR, z1 + 0.15],
      [px, TUN.FLOOR, z0 - 0.15],
    ];
    const pts: [number, number, number][] = [
      [px, top, z0],
      [px, top, z1],
      [px, TUN.FLOOR, z1],
      [px, TUN.FLOOR, z0],
    ];
    draw.push({
      z: z1 - 0.02,
      node: (
        <g key="pass">
          <polygon points={pr.poly(frame)} fill={col('#3a403d', (z0 + z1) / 2)} />
          <polygon points={pr.poly(pts)} fill="#030404" />
        </g>
      ),
    });
    // табличка
    const sz = z0 - 0.75;
    const sy = -0.6;
    const sx = -2.32;
    // табличка на кронштейне, развёрнута к камере
    const [px0, py0] = pr.P(sx + 0.05, sy, sz);
    const [px1, py1] = pr.P(sx + 0.75, sy + 0.32, sz);
    const s = pr.scaleAt(sz);
    draw.push({
      z: sz - 0.01,
      node: (
        <g key="sign">
          <rect x={px0 - s * 0.05} y={py0 + s * 0.12} width={s * 0.1} height={s * 0.06} fill={col('#4a4e4a', sz)} />
          <rect x={px0} y={py0} width={px1 - px0} height={py1 - py0} fill={col('#c9c3a8', sz)} />
          <rect x={px0} y={py0} width={px1 - px0} height={(py1 - py0) * 0.12} fill={col('#7A1712', sz)} />
          <text x={(px0 + px1) / 2} y={py0 + (py1 - py0) * 0.66} textAnchor="middle" fontFamily={FONT_MONO} fontWeight={500} fontSize={s * 0.17} fill={col('#1a1a14', sz)}>
            ВШ-12
          </text>
          <text x={(px0 + px1) / 2} y={py0 + (py1 - py0) * 0.92} textAnchor="middle" fontFamily={FONT_MONO} fontSize={s * 0.055} fill={col('#3a3a30', sz)}>
            вентшахта
          </text>
        </g>
      ),
    });
  }

  for (const it of items) draw.push({z: it.z, node: <g key={`it${it.z}-${draw.length}`}>{it.render(pr)}</g>});
  draw.sort((a, b) => b.z - a.z);
  return (
    <svg width={1920} height={1080} viewBox="0 0 1920 1080" style={{position: 'absolute', left: 0, top: 0, overflow: 'visible'}}>
      <rect x={-600} y={-600} width={3120} height={2280} fill={col('#1f2422', zNear + 0.5)} />
      {draw.map((d) => d.node)}
    </svg>
  );
};

/** Проекция точки на пол туннеля: удобно ставить персонажей. */
export const tunnelFloor = (pr: Projector, x: number, z: number) => pr.P(x, TUN.FLOOR, z);
export const makeTunnelProjector = makeProjector;
