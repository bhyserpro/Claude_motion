import React from 'react';
import {AbsoluteFill, interpolate, random, useCurrentFrame} from 'remotion';
import {Layer, Stage25D} from '../../../components/Stage25D';
import {FlashlightMask} from '../../../components/FX';
import {Timestamp} from '../../../components/Text';
import {Tunnel, TUN} from '../../../components/Props/Tunnel';
import {Pavel} from '../../../components/Characters/Pavel';
import {walkPose} from '../../../components/Characters/Rig';
import {camKeys, handheld} from '../../../lib/camera';
import {makeProjector} from '../../../lib/persp';
import {Snd} from '../../common/audio';
import {placeAt} from '../../common/cast';

/** 2:10–2:25. Павел уходит в туннель. Длинный статичный кадр: конус света уменьшается до точки и гаснет. */
export const Ep1PavelLeaves: React.FC<{dur: number}> = ({dur}) => {
  const frame = useCurrentFrame();
  const walkEnd = 400;
  const z = interpolate(frame, [0, walkEnd], [2.2, 21], {extrapolateRight: 'clamp'});
  const pcam = {x: 0.3, y: -0.2, z: -1.2, f: 950};
  const pr = makeProjector(pcam);
  const p = placeAt(pr, 0.45, TUN.FLOOR, z, 2, 34);
  const [hx, hy] = pr.P(0.62, 0.35, z + 0.2);
  const tz = z + 7;
  const [tx, ty] = pr.P(0.25, 0.9, tz);
  // фонарь тускнеет, потом гаснет
  const dying = frame > 385 ? (frame < 405 ? (random(`pv${frame}`) < 0.5 ? 0.15 : 0.6) : 0) : 1;
  const intensity = interpolate(frame, [0, 380], [1, 0.75], {extrapolateRight: 'clamp'}) * dying;
  const cam = handheld(camKeys(frame, [{f: 0}]), frame, 1.2, 'pvl');
  return (
    <AbsoluteFill>
      <Stage25D cam={cam}>
        <Layer z={1}>
          <Tunnel
            id="pvl"
            pcam={pcam}
            light="flashlight"
            items={[
              {
                z,
                render: () => (
                  <Pavel x={p.x} y={p.y} scale={p.scale} view="back" light="silhouette" lod={1} frame={frame} pose={walkPose((frame / 34) % 1, 0.8, {armL: [40, 20]})} rimDir={-90} rimOpacity={0.3 * intensity} />
                ),
              },
            ]}
          />
        </Layer>
        <FlashlightMask
          id="pvlm"
          darkness={0.985}
          beams={[
            {sx: hx, sy: hy, tx, ty, r: pr.scaleAt(tz) * 2.6, intensity, stretch: 1.8},
            {sx: hx, sy: hy, tx: hx, ty: hy - pr.scaleAt(z) * 0.3, r: pr.scaleAt(z) * 1.4, intensity: intensity * 0.35, stretch: 1},
          ]}
          haze={0.35}
        />
      </Stage25D>
      <Timestamp text="ДЕНЬ 1 — 19:20" start={0} end={dur} />
      <Snd src="tunnel_drone.wav" dur={dur} vol={0.5} loop trim={600} />
      <Snd src="shuffle.wav" dur={walkEnd} vol={(f) => interpolate(f, [0, walkEnd], [0.35, 0.02])} loop />
      <Snd src="noise_cut.wav" from={404} dur={12} vol={0.15} />
    </AbsoluteFill>
  );
};
