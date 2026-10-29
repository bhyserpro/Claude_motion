import React from 'react';
import {AbsoluteFill, Easing, interpolate, Sequence, useCurrentFrame} from 'remotion';
import {DSvg, Stage25D} from '../../../components/Stage25D';
import {Subtitle} from '../../../components/Text';
import {NinaNotebook} from '../../../components/Props/Notebook';
import {Nina} from '../../../components/Characters/Nina';
import {camKeys, handheld} from '../../../lib/camera';
import {Snd} from '../../common/audio';
import {NinaAsleep} from './Bag';

/** 2:20–2:45. Вагон. Нина не спит. Загиб расправлен. Последняя строка: «Сомов Г. — 6,2 Зв». */
export const Ep3List: React.FC<{dur: number}> = ({dur}) => {
  const frame = useCurrentFrame();
  return (
    <AbsoluteFill>
      <Sequence durationInFrames={190}>
        <NinaAsleep frame={frame} awake glebPose="stand" push={0.15} />
      </Sequence>
      <Sequence from={190} durationInFrames={330}>
        <Unfold />
      </Sequence>
      <Sequence from={520} durationInFrames={dur - 520}>
        <NinaClose />
      </Sequence>
      <Subtitle voice="E3-10" who="НИНА" text="Мне жаль. Я хотела, чтобы ты не мучился." start={545} end={dur - 10} />
      <Snd src="tunnel_drone.wav" dur={dur} vol={0.38} loop trim={10} />
      <Snd src="heartbeat.wav" from={260} dur={dur - 260} vol={0.35} loop fadeIn={40} />
    </AbsoluteFill>
  );
};

export const Unfold: React.FC = () => {
  const frame = useCurrentFrame();
  const fold = interpolate(frame, [30, 80], [1, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const hl = interpolate(frame, [110, 150], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const k = interpolate(frame, [100, 250], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.inOut(Easing.cubic)});
  // наезд на последнюю строку списка (её центр — y≈997 в координатах листа)
  const base = handheld(camKeys(frame, [{f: 0}]), frame, 2, 'unf');
  const zoom = 1 + 0.6 * k;
  const cam = {...base, zoom, shakeY: base.shakeY - k * ((997 - 540) * zoom - 40), shakeX: base.shakeX + k * 60};
  return (
    <Stage25D cam={cam} bg="#0a0303">
      <DSvg>
        <rect x={-300} y={-300} width={2600} height={1700} fill="#1a0605" />
        <NinaNotebook x={960} y={560} scale={1.05} rotate={-3} fold={fold} highlightLast={hl} light="emergency" />
      </DSvg>
    </Stage25D>
  );
};

const NinaClose: React.FC = () => {
  const frame = useCurrentFrame();
  return (
    <Stage25D cam={handheld(camKeys(frame, [{f: 0, zoom: 1}, {f: 230, zoom: 1.06}]), frame, 1.5, 'nc3')} bg="#120303">
      <DSvg>
        <rect x={-200} y={-200} width={2400} height={1500} fill="#1a0605" />
        <Nina x={1040} y={2600} scale={2.5} view="three_quarter" facing={-1} lod={2} light="emergency" episode={3} frame={frame} pose={{headYaw: -0.2, armL: [4, 4], armR: [4, 4]}} />
      </DSvg>
    </Stage25D>
  );
};
