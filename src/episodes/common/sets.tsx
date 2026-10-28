import React from 'react';
import {DSvg, Layer} from '../../components/Stage25D';
import {CarOutside, CarPoles, CarWall, CorridorItem, CarCorridor, Rect, seatXs, setMapper, SetLight, CORRIDOR} from '../../components/Props/MetroCar';
import {Tunnel, TunnelItem, TUN} from '../../components/Props/Tunnel';
import {POSES, Pose} from '../../components/Characters/Rig';
import {Projector, PCam} from '../../lib/persp';
import {Actor, ActorView, CastId, placeAt} from './cast';

/** Высота ступней сидящих в виде сбоку и масштаб фигур на дальнем плане вагона. */
export const SIDE_FEET = 785;
export const SIDE_SCALE = 0.41;

export const seat = (id: CastId, i: number, extra: Partial<Actor> = {}): Actor => ({
  id,
  x: seatXs()[i],
  y: SIDE_FEET,
  scale: SIDE_SCALE,
  pose: POSES.sitFront,
  view: 'front',
  ...extra,
});

export const standSide = (id: CastId, x: number, extra: Partial<Actor> = {}): Actor => ({
  id,
  x,
  y: SIDE_FEET + 10,
  scale: SIDE_SCALE,
  view: 'front',
  ...extra,
});

/**
 * Вид сбоку на вагон (multiplane): туннель за окнами (z=4), стена с сидящими (z=1.6),
 * средний план (z=1.15), поручни на переднем плане (z=0.6, размыты).
 */
export const CarSideLayers: React.FC<{
  frame: number;
  light: SetLight;
  lamp?: number;
  motion?: number;
  id: string;
  actors?: Actor[];
  mid?: Actor[];
  midZ?: number;
  emergencyLamp?: number;
  glass?: (w: Rect, i: number) => React.ReactNode;
  outside?: React.ReactNode;
  wallOverlay?: React.ReactNode; // поверх людей в слое стены (цифры, пыль)
  midOverlay?: React.ReactNode;
  poles?: boolean;
  dirt?: number;
  coatsOnFloor?: boolean;
  actorLight?: SetLight | 'silhouette';
}> = ({
  frame,
  light,
  lamp = 1,
  motion = 0,
  id,
  actors = [],
  mid = [],
  midZ = 1.15,
  emergencyLamp = 0,
  glass,
  outside,
  wallOverlay,
  midOverlay,
  poles = true,
  dirt = 0,
  coatsOnFloor = false,
  actorLight,
}) => {
  const al = (actorLight ?? light) as Actor['light'];
  const dim = lamp < 0.999 ? Math.max(0, lamp) : 1;
  return (
    <>
      <Layer z={4}>
        <CarOutside frame={frame} motion={motion} light={light}>
          {outside}
        </CarOutside>
      </Layer>
      <Layer z={1.6}>
        <CarWall light={light} lamp={lamp} id={`${id}-w`} glass={glass} emergencyLamp={emergencyLamp} dirt={dirt} coatsOnFloor={coatsOnFloor} />
        <DSvg>
          <g opacity={1}>
            {actors.map((a, i) => (
              <ActorView key={i} a={{light: al, frame, ...a, fog: Math.max(a.fog ?? 0, 1 - dim)}} />
            ))}
          </g>
        </DSvg>
        {wallOverlay}
      </Layer>
      {mid.length || midOverlay ? (
        <Layer z={midZ}>
          <DSvg>
            {mid.map((a, i) => (
              <ActorView key={i} a={{light: al, frame, lod: 2, ...a, fog: Math.max(a.fog ?? 0, 1 - dim)}} />
            ))}
          </DSvg>
          {midOverlay}
        </Layer>
      ) : null}
      {poles ? (
        <Layer z={0.6} blur={7}>
          <CarPoles light={light} lamp={lamp} />
        </Layer>
      ) : null}
    </>
  );
};

/** Сидящий у стены в перспективе вагона: лицом к проходу. */
export type CorridorActor = {id: CastId; side: -1 | 1; z: number; pose?: Pose; lying?: boolean; extra?: Partial<Actor>; stand?: number};

export const corridorItems = (list: CorridorActor[], light: Actor['light'], frame: number, fogMul = 1): CorridorItem[] =>
  list.map((c) => ({
    z: c.z,
    render: (pr: Projector) => {
      const standing = c.stand !== undefined;
      const x = standing ? (c.stand as number) : c.side * 1.15;
      const p = placeAt(pr, x, CORRIDOR.FLOOR, c.z);
      const pose = c.pose ?? (standing ? {} : POSES.sitSide);
      return (
        <ActorView
          a={{
            id: c.id,
            x: p.x,
            y: p.y,
            scale: p.scale,
            fog: p.fog * fogMul,
            view: standing ? 'front' : 'profile',
            facing: c.side === -1 ? 1 : -1,
            pose,
            light,
            frame,
            lod: p.scale > 0.35 ? 2 : 1,
            ...c.extra,
          }}
        />
      );
    },
  }));

export {CarCorridor, Tunnel, TUN};
export type {PCam, CorridorItem, TunnelItem};
export const lightMap = setMapper;
