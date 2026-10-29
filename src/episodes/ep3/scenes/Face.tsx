import React from 'react';
import {AbsoluteFill, Sequence, useCurrentFrame} from 'remotion';
import {DSvg, Stage25D} from '../../../components/Stage25D';
import {TitleCard} from '../../../components/Text';
import {Gleb} from '../../../components/Characters/Gleb';
import {camKeys, handheld} from '../../../lib/camera';
import {Snd} from '../../common/audio';
import {headCloseY} from '../../common/tunnelShot';

/** Крупно: лицо Глеба, наполовину в красном свете. Сердцебиение. */
export const GlebHalfRed: React.FC<{episode?: 3 | 4 | 5; zoom0?: number; zoom1?: number; dur?: number}> = ({episode = 3, zoom0 = 1, zoom1 = 1.08, dur = 300}) => {
  const frame = useCurrentFrame();
  const S = 3.1;
  const y = headCloseY(182, S, 470);
  return (
    <Stage25D cam={handheld(camKeys(frame, [{f: 0, zoom: zoom0}, {f: dur, zoom: zoom1}]), frame, 1.2, 'ghr')} bg="#000">
      <DSvg>
        <rect x={-200} y={-200} width={2400} height={1500} fill="#0a0202" />
        <Gleb x={960} y={y} scale={S} view="front" episode={episode} lod={2} light="emergency" rimDir={0} rimOpacity={0.7} rimWidth={0.3} frame={frame} pose={{armL: [4, 6], armR: [4, 6], headPitch: 0.05}} />
        <defs>
          <linearGradient id="half" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#000" stopOpacity={0.97} />
            <stop offset="47%" stopColor="#000" stopOpacity={0.93} />
            <stop offset="55%" stopColor="#000" stopOpacity={0} />
          </linearGradient>
        </defs>
        <rect x={-200} y={-200} width={2400} height={1500} fill="url(#half)" />
      </DSvg>
    </Stage25D>
  );
};

/** Лицо Глеба в красном 4 с, карточка «Серия 3. Список» 2,5 с (патч №1; тизер E3-N08 не озвучен). */
export const Ep3Face: React.FC<{dur: number; standalone: boolean}> = ({dur, standalone}) => (
  <AbsoluteFill style={{background: '#000'}}>
    <Sequence durationInFrames={120}>
      <GlebHalfRed dur={120} />
    </Sequence>
    {standalone ? (
      <Sequence from={126} durationInFrames={dur - 126}>
        <TitleCard episode={3} title="Список" dur={dur - 126} />
      </Sequence>
    ) : null}
    <Snd src="heartbeat.wav" dur={124} vol={0.85} loop fadeOut={6} />
  </AbsoluteFill>
);
