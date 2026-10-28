import React from 'react';
import {AbsoluteFill, Easing, interpolate, useCurrentFrame} from 'remotion';
import {Stage25D} from '../../../components/Stage25D';
import {HookText} from '../../../components/Text';
import {CAM0, handheld} from '../../../lib/camera';
import {Snd} from '../../common/audio';
import {CarSideLayers} from '../../common/sets';
import {PalmOnGlass, WindowFace, WIN} from '../faces';

/** ХУК серии 4: окно изнутри, красный свет. С той стороны проступают лица. Все поворачиваются в камеру. */
export const Ep4Hook: React.FC<{dur: number}> = ({dur}) => {
  const frame = useCurrentFrame();
  const ap = (a: number, b: number) => interpolate(frame, [a, b], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const turn = interpolate(frame, [148, 160], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.bezier(0.7, 0, 0.3, 1)});
  const yawA = -0.55 * (1 - turn);
  const yawB = 0.6 * (1 - turn);
  const yawC = -0.4 * (1 - turn);
  const cam = handheld({...CAM0, zoom: 1.9, shakeX: -(1300 - 960) * 1.9, shakeY: (540 - 400) * 1.9}, frame, 2.5, 'h4');
  return (
    <AbsoluteFill>
      <Stage25D cam={cam} fogEnd={10}>
        <CarSideLayers
          frame={frame}
          id="h4"
          light="emergency"
          lamp={0.7}
          emergencyLamp={0.75}
          poles={false}
          outside={
            <>
              <WindowFace w={WIN[8]} seed="w4a" appear={0.4 + 0.6 * ap(0, 45)} yaw={yawA} frame={frame} />
              <WindowFace w={WIN[9]} seed="w4b" appear={ap(60, 110)} yaw={yawB} dx={-30} frame={frame} />
              <WindowFace w={WIN[9]} seed="w4c" appear={ap(100, 145)} yaw={yawC} dx={110} scale={0.5} frame={frame} />
            </>
          }
          glass={(w, i) =>
            i === 8 ? <PalmOnGlass w={w} press={ap(40, 70)} seed="ph4a" /> : i === 9 ? <PalmOnGlass w={w} press={ap(95, 125)} side={-1} seed="ph4b" /> : null
          }
        />
      </Stage25D>
      <HookText lines={['Ты раскрыл убийство.', 'И сказал об этом **вслух**.']} start={3} end={dur - 3} top={0.68} />
      <Snd src="tunnel_drone.wav" dur={dur} vol={0.5} loop />
      <Snd src="glass_squeak.wav" from={62} dur={48} vol={0.6} />
      <Snd src="glass_squeak.wav" from={118} dur={40} vol={0.5} trim={10} />
      <Snd src="heartbeat.wav" dur={dur} vol={0.4} loop />
    </AbsoluteFill>
  );
};
