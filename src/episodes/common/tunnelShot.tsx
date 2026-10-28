import React from 'react';
import {Layer, Stage25D} from '../../components/Stage25D';
import {Beam, FlashlightMask} from '../../components/FX';
import {Tunnel, TunnelItem} from '../../components/Props/Tunnel';
import {SetLight} from '../../components/Props/MetroCar';
import {Camera, CAM0} from '../../lib/camera';
import {makeProjector, PCam, Projector} from '../../lib/persp';

export type WorldBeam = {
  x: number;
  y: number;
  z: number;
  r: number; // радиус пятна в метрах
  intensity?: number;
  sx?: number; // источник на экране
  sy?: number;
  from?: [number, number, number]; // источник в мире (вместо sx/sy)
  color?: string;
  stretch?: number;
};

/** Перевод мировых лучей в экранные для FlashlightMask. */
export const toBeams = (pr: Projector, beams: WorldBeam[]): Beam[] =>
  beams.map((b) => {
    const [tx, ty] = pr.P(b.x, b.y, b.z);
    let sx = b.sx ?? 1320;
    let sy = b.sy ?? 1180;
    if (b.from) [sx, sy] = pr.P(...b.from);
    return {sx, sy, tx, ty, r: pr.scaleAt(b.z) * b.r, intensity: b.intensity ?? 1, color: b.color, stretch: b.stretch ?? 1.3};
  });

/** Туннель в луче фонаря: декорация + персонажи + маска тьмы. */
export const TunnelShot: React.FC<{
  id: string;
  pcam: PCam;
  cam?: Camera;
  items?: (pr: Projector) => TunnelItem[];
  beams: WorldBeam[];
  darkness?: number;
  light?: SetLight;
  doorZ?: number | null;
  passageZ?: number | null;
  doorScratches?: number;
  footprints?: {boots: number; bare: number};
  haze?: number;
  overlay?: (pr: Projector) => React.ReactNode;
  glowTint?: string;
  glowA?: number;
  noMask?: boolean;
}> = ({id, pcam, cam = CAM0, items, beams, darkness = 0.975, light = 'flashlight', doorZ = null, passageZ = null, doorScratches = 0, footprints, haze = 0.14, overlay, glowTint, glowA, noMask}) => {
  const pr = makeProjector(pcam);
  return (
    <Stage25D cam={cam}>
      <Layer z={1}>
        <Tunnel
          id={id}
          pcam={pcam}
          light={light}
          items={items ? items(pr) : []}
          doorZ={doorZ}
          passageZ={passageZ}
          doorScratches={doorScratches}
          footprints={footprints}
          glowTint={glowTint}
          glowA={glowA}
        />
        {overlay ? overlay(pr) : null}
      </Layer>
      {noMask ? null : <FlashlightMask id={`${id}-m`} darkness={darkness} beams={toBeams(pr, beams)} haze={haze} />}
    </Stage25D>
  );
};

/** Положение «головы крупным планом»: y ступней, чтобы центр головы оказался в targetY. */
export const headCloseY = (heightCm: number, scale: number, targetY: number, hipDrop = 0) => {
  const hu = ((heightCm / 180) * 1000) / 6;
  const headCenter = -(3 - hipDrop) * hu - 1.72 * hu - 0.2 * hu - 0.5 * hu;
  return targetY - headCenter * scale;
};
