import React from 'react';
import {AbsoluteFill, Sequence, useCurrentFrame} from 'remotion';
import {DSvg, Stage25D} from '../../../components/Stage25D';
import {Monologue, PencilNumber, Timestamp} from '../../../components/Text';
import {Gleb} from '../../../components/Characters/Gleb';
import {camKeys, handheld} from '../../../lib/camera';
import {Snd} from '../../common/audio';
import {At} from '../../common/Offset';
import {BloodOnPaper} from '../../common/closeups';
import {headCloseY} from '../../common/tunnelShot';
import {Chamber} from '../../ep3/scenes/Shaft';
import {SHAFT} from '../../ep3/timing';
import {DontCount} from '../../ep1/scenes/Fifteen';

/** Воспоминание: обесцвеченная вставка с карандашной пометкой Глеба. */
const Memory: React.FC<{children: React.ReactNode; note: string; x?: number; y?: number}> = ({children, note, x = 1300, y = 300}) => (
  <AbsoluteFill style={{filter: 'grayscale(0.7) contrast(1.1)'}}>
    {children}
    <AbsoluteFill>
      <PencilNumber x={x} y={y} text={note} at={8} size={72} writeFrames={18} color="#d8d2c4" rotate={-4} />
    </AbsoluteFill>
  </AbsoluteFill>
);

/** 0:12–0:40. День 6, 04:00. Капля крови на бланке. «Свой посчитал за минуту.» Пепел → решётка открыта. Они идут на звук. */
export const Ep5Reason: React.FC<{dur: number; standalone: boolean}> = ({dur, standalone}) => {
  const frame = useCurrentFrame();
  return (
    <AbsoluteFill>
      <Sequence durationInFrames={300}>
        <BloodOnPaper dropAt={70} />
      </Sequence>
      <Sequence from={300} durationInFrames={120}>
        <Memory note="пепел → решётка открыта" x={1250} y={250}>
          <At at={SHAFT.enterChamber + 40 - SHAFT.enterChamber}>
            <Chamber offset={SHAFT.enterChamber} />
          </At>
        </Memory>
      </Sequence>
      <Sequence from={420} durationInFrames={110}>
        <Memory note="идут на звук" x={1200} y={260}>
          <At at={SHAFT.turn - 10 - SHAFT.enterChamber}>
            <Chamber offset={SHAFT.enterChamber} />
          </At>
        </Memory>
      </Sequence>
      <Sequence from={530} durationInFrames={100}>
        <Memory note="не считай" x={1400} y={820}>
          <At at={150}>
            <DontCount />
          </At>
        </Memory>
      </Sequence>
      <Sequence from={630} durationInFrames={dur - 630}>
        <GlebSick />
      </Sequence>
      <Timestamp text="ДЕНЬ 6 — 04:00" suffix={standalone ? 'за 2 часа до этого' : undefined} start={0} end={dur} suffixEnd={130} />
      <Monologue start={30} end={290} lines={['Двадцать лет я считал чужие убытки.', 'Свой посчитал за минуту.']} />
      <Monologue start={650} end={dur - 4} lines={['Им нужен звук. Я дам им звук.']} />
      <Snd src="hit.wav" dur={50} vol={0.6} />
      <Snd src="drip.wav" from={80} dur={14} vol={0.6} />
      <Snd src="tunnel_drone.wav" dur={dur} vol={0.4} loop trim={60} />
      <Snd src="heartbeat.wav" from={630} dur={dur - 630} vol={0.4} loop fadeIn={30} />
    </AbsoluteFill>
  );
};

const GlebSick: React.FC = () => {
  const frame = useCurrentFrame();
  const S = 3.0;
  return (
    <Stage25D cam={handheld(camKeys(frame, [{f: 0, zoom: 1}, {f: 210, zoom: 1.06}]), frame, 1.2, 'gs5')} bg="#080202">
      <DSvg>
        <rect x={-200} y={-200} width={2400} height={1500} fill="#140404" />
        <Gleb x={960} y={headCloseY(182, S, 470)} scale={S} view="three_quarter" facing={1} episode={5} lod={2} light="emergency" rimWidth={0.3} frame={frame} pose={{armL: [4, 6], armR: [4, 6], headPitch: 0.15}} />
      </DSvg>
    </Stage25D>
  );
};
