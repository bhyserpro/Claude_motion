import React from 'react';
import {Pavel, PAVEL_POSES} from '../../components/Characters/Pavel';
import {HeldItem} from '../../components/Characters/items';
import {TUN} from '../../components/Props/Tunnel';
import {Projector} from '../../lib/persp';
import {placeAt} from '../common/cast';
import {Light} from '../../components/Characters/Rig';

export const DOOR_Z = 14;
export const PAVEL_Z = DOOR_Z - 0.9;
export const PAVEL_X = -1.72;

/** Мёртвый Павел у гермозатвора: сидит у стены, лицом к путям, рука упала на рельс. */
export const deadPavel = (frame: number, opts: {handOnRail?: boolean; light?: Light; lod?: 0 | 1 | 2} = {}) => ({
  z: PAVEL_Z,
  render: (pr: Projector) => {
    const p = placeAt(pr, PAVEL_X, TUN.FLOOR, PAVEL_Z, 2, 34);
    const pose = {
      ...PAVEL_POSES.dead_sitting,
      headTilt: -18,
      headYaw: 0.15,
      ...(opts.handOnRail ? {armL: [62, -4] as [number, number], handL: 'open' as const} : {}),
    };
    // его фонарь рядом ещё светит
    const [fx, fy] = pr.P(PAVEL_X + 0.75, TUN.FLOOR - 0.06, PAVEL_Z - 0.3);
    const s = pr.scaleAt(PAVEL_Z);
    return (
      <g>
        <Pavel x={p.x} y={p.y} scale={p.scale} view="three_quarter" facing={1} dead light={opts.light ?? 'flashlight'} lod={opts.lod ?? 1} frame={frame} pose={pose} />
        <g transform={`translate(${fx},${fy}) rotate(-8) scale(${s / 220})`}>
          <HeldItem kind="flashlight" k={{c: (x: string) => x, h: 160, lod: 1, view: 'front', light: 'warm', frame, rim: false, side: 1}} />
        </g>
      </g>
    );
  },
});

/** Камни у рельсов, рассыпанный щебень. */
export const gravelPile = (z: number) => ({
  z,
  render: (pr: Projector) => {
    const els: React.ReactNode[] = [];
    for (let i = 0; i < 18; i++) {
      const x = -1.1 + (i % 6) * 0.08;
      const zz = z + Math.floor(i / 6) * 0.1;
      const [sx, sy] = pr.P(x, TUN.FLOOR - 0.02, zz);
      const r = pr.scaleAt(zz) * 0.03;
      els.push(<circle key={i} cx={sx} cy={sy} r={r} fill="#5E605C" />);
    }
    return <g>{els}</g>;
  },
});
