import React from 'react';
import {AbsoluteFill, interpolate, Sequence, useCurrentFrame} from 'remotion';
import {DSvg, Stage25D} from '../../../components/Stage25D';
import {Subtitle} from '../../../components/Text';
import {Korneev, KORNEEV_POSES} from '../../../components/Characters/Korneev';
import {Gleb} from '../../../components/Characters/Gleb';
import {walkPose} from '../../../components/Characters/Rig';
import {TUN} from '../../../components/Props/Tunnel';
import {camKeys, handheld} from '../../../lib/camera';
import {Snd} from '../../common/audio';
import {placeAt} from '../../common/cast';
import {CarSideLayers} from '../../common/sets';
import {TunnelShot} from '../../common/tunnelShot';
import {EP2_CAMP} from '../../ep2/cast';
import {Bottles} from '../../ep2/scenes/Camp';
import {PASSAGE_Z} from '../../ep2/scenes/Walk';

/** 1:05–1:25. Корнеев: «Хватит. Я наверх, через шахту.» Глеб идёт с ним. */
export const Ep3Korneev: React.FC<{dur: number}> = ({dur}) => (
  <AbsoluteFill>
    <Sequence durationInFrames={300}>
      <Decide />
    </Sequence>
    <Sequence from={300} durationInFrames={dur - 300}>
      <ToShaft dur={dur - 300} />
    </Sequence>
    <Subtitle voice="E3-05" who="КОРНЕЕВ" text="Хватит. Я наверх, через шахту." start={50} end={170} />
    <Snd src="tunnel_drone.wav" dur={dur} vol={0.45} loop trim={170} />
    <Snd src="shuffle.wav" from={300} dur={dur - 300} vol={0.4} loop />
  </AbsoluteFill>
);

const Decide: React.FC = () => {
  const frame = useCurrentFrame();
  const up = interpolate(frame, [20, 50], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const cam = handheld(camKeys(frame, [{f: 0, x: 420, dolly: 0.2}, {f: 300, x: 470, dolly: 0.3}]), frame, 2.5, 'kd');
  return (
    <Stage25D cam={cam} fogEnd={10}>
      <CarSideLayers
        frame={frame}
        id="kd"
        light="emergency"
        lamp={0.6}
        emergencyLamp={0.6}
        dirt={0.7}
        coatsOnFloor
        actors={EP2_CAMP.filter((a) => a.id !== 'semyon')}
        midOverlay={
          <DSvg>
            <Bottles x={1480} y={1010} s={0.9} />
            <Korneev
              x={1450 - up * 40}
              y={1060}
              scale={0.6}
              view="three_quarter"
              facing={-1}
              lod={2}
              light="emergency"
              frame={frame}
              pose={up < 1 ? {...KORNEEV_POSES.guard_water, hipDrop: 1.75 * (1 - up)} : KORNEEV_POSES.stand_dominant}
              holdR="baton"
            />
            <Gleb x={980} y={1040} scale={0.64} view="three_quarter" facing={1} episode={3} lod={2} light="emergency" frame={frame} pose={{armL: [4, 8], armR: [6, 12], headYaw: frame > 200 ? -0.6 : 0}} />
          </DSvg>
        }
      />
    </Stage25D>
  );
};

const ToShaft: React.FC<{dur: number}> = ({dur}) => {
  const frame = useCurrentFrame();
  const camZ = interpolate(frame, [0, dur], [PASSAGE_Z - 7, PASSAGE_Z - 2.6]);
  const ph = (frame / 30) % 1;
  return (
    <TunnelShot
      id="ts"
      pcam={{x: 0.2, y: -0.05, z: camZ, f: 920}}
      cam={handheld(camKeys(frame, [{f: 0}]), frame, 3.5, 'ts')}
      passageZ={PASSAGE_Z}
      items={(pr) => [
        {
          z: camZ + 3.4,
          render: () => {
            const p = placeAt(pr, -0.9, TUN.FLOOR, camZ + 3.4, 2, 34);
            return <Korneev x={p.x} y={p.y} scale={p.scale} view="back" light="flashlight" frame={frame} pose={walkPose(ph, 0.8, {armR: [40, 20]})} holdR="baton" />;
          },
        },
        {
          z: camZ + 2.2,
          render: () => {
            const p = placeAt(pr, 0.4, TUN.FLOOR, camZ + 2.2, 2, 34);
            return <Gleb x={p.x} y={p.y} scale={p.scale} view="back" episode={3} light="flashlight" frame={frame} pose={walkPose((ph + 0.5) % 1, 0.7, {armR: [30, 20]})} holdR="flashlight" />;
          },
        },
      ]}
      beams={[
        {x: -2.1, y: 0.2, z: PASSAGE_Z + 0.4, r: 1.3, intensity: 1, sx: 760, sy: 560},
        {x: 0.2, y: 1.0, z: camZ + 7, r: 1.8, intensity: 0.8, sx: 1150, sy: 640},
        {x: -0.2, y: 0.4, z: camZ + 2.8, r: 1.3, intensity: 0.45, sx: 960, sy: 1150},
      ]}
    />
  );
};
