import React from 'react';
import {Blind} from '../../components/Characters/Blind';
import {CoatFigure} from '../../components/Characters/CoatFigure';
import {Gleb} from '../../components/Characters/Gleb';
import {Korneev} from '../../components/Characters/Korneev';
import {Nina} from '../../components/Characters/Nina';
import {Passenger, PassengerType} from '../../components/Characters/Passenger';
import {Pavel} from '../../components/Characters/Pavel';
import {Light, LOD, Pose, View} from '../../components/Characters/Rig';
import {Semyon} from '../../components/Characters/Semyon';
import {HeldItemKind} from '../../components/Characters/items';
import {fogAt, Projector, rigScaleAt} from '../../lib/persp';

/** Состав вагона: 13 пассажиров + машинист = 14. */
export type CastId =
  | 'gleb'
  | 'nina'
  | 'semyon'
  | 'korneev'
  | 'olga'
  | 'akhmed'
  | 'office'
  | 'student'
  | 'oldman'
  | 'puffer'
  | 'worker'
  | 'teen'
  | 'business'
  | 'pavel'
  | 'coat';

export type Actor = {
  id: CastId;
  x: number;
  y: number;
  scale: number;
  view?: View;
  facing?: 1 | -1;
  pose?: Pose;
  light?: Light;
  lod?: LOD;
  ep?: 1 | 2 | 3 | 4 | 5;
  holdR?: HeldItemKind;
  holdL?: HeldItemKind;
  ash?: number;
  fog?: number;
  dirt?: number;
  coatOff?: boolean;
  opacity?: number;
  frame?: number;
  extra?: Record<string, unknown>;
};

/** Отрисовка любого персонажа по id. */
export const ActorView: React.FC<{a: Actor}> = ({a}) => {
  const common = {
    x: a.x,
    y: a.y,
    scale: a.scale,
    view: a.view,
    facing: a.facing,
    pose: a.pose,
    light: a.light,
    lod: a.lod ?? 1,
    fog: a.fog,
    opacity: a.opacity,
    frame: a.frame,
    ash: a.ash,
  };
  const ex = a.extra ?? {};
  switch (a.id) {
    case 'gleb':
      return <Gleb {...common} episode={a.ep} holdR={a.holdR} holdL={a.holdL} {...ex} />;
    case 'nina':
      return <Nina {...common} episode={a.ep} holdR={a.holdR} holdL={a.holdL} {...ex} />;
    case 'semyon':
      return <Semyon {...common} holdR={a.holdR} holdL={a.holdL} {...ex} />;
    case 'korneev':
      return <Korneev {...common} holdR={a.holdR} holdL={a.holdL} {...ex} />;
    case 'pavel':
      return <Pavel {...common} holdR={a.holdR} holdL={a.holdL} {...ex} />;
    case 'coat':
      return <CoatFigure {...common} {...ex} />;
    default:
      return <Passenger {...common} type={a.id as PassengerType} seed={`cast-${a.id}`} dirt={a.dirt} coatOff={a.coatOff} {...ex} />;
  }
};

/** Персонаж в перспективной декорации: точка пола (x, floorY, z) → экран. */
export const placeAt = (pr: Projector, x: number, floorY: number, z: number, fogStart = 3, fogEnd = 26) => {
  const [sx, sy] = pr.P(x, floorY, z);
  return {x: sx, y: sy, scale: rigScaleAt(pr, z), fog: fogAt(pr.depth(z), fogStart, fogEnd)};
};

export const BlindAt: React.FC<{pr: Projector; x: number; floorY: number; z: number; seed: string; kind?: 'A' | 'B' | 'C'; light?: Light; headYaw?: number; walkT?: number; facing?: 1 | -1; fogMax?: number; lod?: LOD}> = ({
  pr,
  x,
  floorY,
  z,
  seed,
  kind = 'B',
  light = 'flashlight',
  headYaw = 0,
  walkT = 0,
  facing = 1,
  fogMax = 1,
  lod = 1,
}) => {
  const p = placeAt(pr, x, floorY, z);
  return <Blind x={p.x} y={p.y} scale={p.scale} seed={seed} kind={kind} light={light} headYaw={headYaw} walkT={walkT} facing={facing} fog={p.fog * fogMax} lod={lod} />;
};
