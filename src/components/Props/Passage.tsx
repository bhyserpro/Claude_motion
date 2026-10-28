import React from 'react';
import {mix} from '../../lib/color';
import {fogAt, makeProjector, PCam, Projector} from '../../lib/persp';
import {setMapper, SetLight} from './MetroCar';

/** Узкий боковой проход к вентшахте: прямоугольный бетонный коридор с трубами. */
export type PassageItem = {z: number; render: (pr: Projector) => React.ReactNode};
export const PASS = {HW: 0.8, FLOOR: 1.55, CEIL: -0.75};

export const Passage: React.FC<{pcam: PCam; light: SetLight; items?: PassageItem[]; length?: number; endGlow?: number; fog?: string}> = ({
  pcam,
  light,
  items = [],
  length = 22,
  endGlow = 0,
  fog = '#040505',
}) => {
  const pr = makeProjector(pcam);
  const base = setMapper(light);
  const col = (c: string, z: number) => mix(base(c), fog, fogAt(pr.depth(z), 1.5, 16));
  const draw: {z: number; node: React.ReactNode}[] = [];
  const zNear = pcam.z + 0.15;
  const {HW, FLOOR, CEIL} = PASS;
  const [ex0, ey0] = pr.P(-HW, CEIL, length);
  const [ex1, ey1] = pr.P(HW, FLOOR, length);
  draw.push({z: length + 1, node: <rect key="end" x={ex0} y={ey0} width={ex1 - ex0} height={ey1 - ey0} fill={endGlow > 0 ? mix('#050606', '#5a5e5a', endGlow) : fog} />});
  for (let z1 = length; z1 > zNear; z1 -= 0.7) {
    const z0 = Math.max(zNear, z1 - 0.7);
    const zm = (z0 + z1) / 2;
    const k = Math.floor(z1 / 0.7) % 2;
    draw.push({
      z: z1,
      node: (
        <g key={z1}>
          <polygon points={pr.poly([[-HW, CEIL, z0], [HW, CEIL, z0], [HW, CEIL, z1], [-HW, CEIL, z1]])} fill={col('#1c2120', zm)} />
          <polygon points={pr.poly([[-HW, FLOOR, z0], [HW, FLOOR, z0], [HW, FLOOR, z1], [-HW, FLOOR, z1]])} fill={col(k ? '#232826' : '#202523', zm)} />
          <polygon points={pr.poly([[-HW, CEIL, z0], [-HW, CEIL, z1], [-HW, FLOOR, z1], [-HW, FLOOR, z0]])} fill={col(k ? '#2A302E' : '#272d2b', zm)} />
          <polygon points={pr.poly([[HW, CEIL, z0], [HW, CEIL, z1], [HW, FLOOR, z1], [HW, FLOOR, z0]])} fill={col(k ? '#262c2a' : '#2A302E', zm)} />
          {/* трубы по правой стене */}
          <polygon points={pr.poly([[HW - 0.02, -0.35, z0], [HW - 0.02, -0.35, z1], [HW - 0.02, -0.2, z1], [HW - 0.02, -0.2, z0]])} fill={col('#3B4240', zm)} />
          <polygon points={pr.poly([[HW - 0.02, -0.1, z0], [HW - 0.02, -0.1, z1], [HW - 0.02, 0.0, z1], [HW - 0.02, 0.0, z0]])} fill={col('#323836', zm)} />
          {/* потёки на левой стене */}
          {k ? <polygon points={pr.poly([[-HW + 0.01, CEIL, z0 + 0.2], [-HW + 0.01, CEIL, z0 + 0.3], [-HW + 0.01, 0.9, z0 + 0.3], [-HW + 0.01, 0.9, z0 + 0.2]])} fill={col('#161a19', zm)} /> : null}
        </g>
      ),
    });
  }
  for (const it of items) draw.push({z: it.z, node: <g key={`pi${it.z}-${draw.length}`}>{it.render(pr)}</g>});
  draw.sort((a, b) => b.z - a.z);
  return (
    <svg width={1920} height={1080} viewBox="0 0 1920 1080" style={{position: 'absolute', left: 0, top: 0, overflow: 'visible'}}>
      <rect x={-600} y={-600} width={3120} height={2280} fill={col('#1c2120', zNear + 0.5)} />
      {draw.map((d) => d.node)}
    </svg>
  );
};
