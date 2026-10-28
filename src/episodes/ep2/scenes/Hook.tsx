import React from 'react';
import {AbsoluteFill, interpolate, random, useCurrentFrame} from 'remotion';
import {HookText} from '../../../components/Text';
import {camKeys, handheld} from '../../../lib/camera';
import {fbm1} from '../../../lib/noise';
import {Snd} from '../../common/audio';
import {TunnelShot} from '../../common/tunnelShot';
import {deadPavel, DOOR_Z, PAVEL_X, PAVEL_Z} from '../shared';

/** ХУК серии 2: луч дрожит по рельсам, находит руку, поднимается к лицу — и гаснет. */
export const Ep2Hook: React.FC<{dur: number}> = ({dur}) => {
  const frame = useCurrentFrame();
  const keys = [0, 55, 100, 150];
  const bx = interpolate(frame, keys, [-0.5, 0.3, -1.0, PAVEL_X + 0.05], {extrapolateRight: 'clamp'});
  const by = interpolate(frame, keys, [1.5, 1.5, 1.42, 0.62], {extrapolateRight: 'clamp'});
  const bz = interpolate(frame, keys, [PAVEL_Z - 0.6, PAVEL_Z + 2.5, PAVEL_Z - 0.2, PAVEL_Z], {extrapolateRight: 'clamp'});
  // дрожание луча
  const jx = fbm1('h2x', frame / 3, 2) * 0.05;
  const jy = fbm1('h2y', frame / 3.4, 2) * 0.04;
  const dead = frame >= 158 ? 0 : frame >= 150 ? (random(`h2d${frame}`) < 0.5 ? 0.2 : 0.9) : 1;
  return (
    <AbsoluteFill>
      <TunnelShot
        id="h2"
        pcam={{x: 0.3, y: -0.1, z: PAVEL_Z - 5.2, f: 1000, cy: 430}}
        cam={handheld(camKeys(frame, [{f: 0}]), frame, 4, 'h2')}
        doorZ={DOOR_Z}
        items={() => [deadPavel(frame, {handOnRail: true, lod: 2})]}
        beams={[{x: bx + jx, y: by + jy, z: bz, r: 0.8, intensity: dead}]}
        darkness={0.96}
      />
      <HookText lines={['Ты нашёл человека, который ушёл за помощью.', 'У него во рту **камни**.']} start={3} end={dur - 2} top={0.18} />
      <Snd src="tunnel_drone.wav" dur={dur} vol={0.6} loop />
      <Snd src="heartbeat.wav" dur={dur} vol={0.45} loop fadeIn={20} />
      <Snd src="breath_close.wav" dur={dur} vol={0.3} loop />
    </AbsoluteFill>
  );
};
