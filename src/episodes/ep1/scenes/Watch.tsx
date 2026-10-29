import React from 'react';
import {AbsoluteFill, Sequence, useCurrentFrame} from 'remotion';
import {DSvg, Stage25D} from '../../../components/Stage25D';
import {Monologue, Timestamp} from '../../../components/Text';
import {useWordFrame} from '../../../components/Voice';
import {Gleb} from '../../../components/Characters/Gleb';
import {camKeys, handheld} from '../../../lib/camera';
import {Snd} from '../../common/audio';
import {CarSideLayers} from '../../common/sets';
import {WatchShot} from '../../common/closeups';
import {EP1_SIDE} from '../cast';

/** 18:46 (E1-N03). Свет моргает ровно на «мигнул», на «В моей работе…» — часы крупно, секундная стрелка идёт к 18:47. */
export const Ep1Watch: React.FC<{dur: number}> = ({dur}) => {
  const blink = useWordFrame('E1-N03', 'мигнул', 80) + 2;
  const cut = useWordFrame('E1-N03', 'В', 110) - 3;
  return (
    <AbsoluteFill>
      <Sequence durationInFrames={cut}>
        <BlinkWide blink={blink} dur={cut} />
      </Sequence>
      <Sequence from={cut} durationInFrames={dur - cut}>
        <WatchClose dur={dur - cut} />
      </Sequence>
      <Timestamp text="ДЕНЬ 0 — 18:46" start={0} end={dur} />
      <Monologue voice="E1-N03" start={6} end={cut + 2} lines={['18:46. Свет мигнул.']} />
      <Monologue voice="E1-N03" start={cut} end={dur} lines={['В моей работе это называется — первый признак.', 'Его тоже никто не замечает.']} />
      <Snd src="rails_loop.wav" dur={dur} vol={0.62} loop trim={120} />
      <Snd src="tunnel_drone.wav" dur={dur} vol={0.32} loop trim={400} />
      <Snd src="noise_cut.wav" from={blink} dur={14} vol={0.35} />
    </AbsoluteFill>
  );
};

const BlinkWide: React.FC<{blink: number; dur: number}> = ({blink, dur}) => {
  const frame = useCurrentFrame();
  const lamp = frame >= blink && frame < blink + 5 ? 0.12 : frame >= blink + 5 && frame < blink + 7 ? 0.6 : 1;
  const cam = handheld(camKeys(frame, [{f: 0, x: 120, dolly: 0.18}, {f: dur, x: 170, dolly: 0.24}]), frame, 2.5, 'blk');
  return (
    <Stage25D cam={cam} fogEnd={10}>
      <CarSideLayers
        frame={frame}
        id="blk"
        light="warm"
        lamp={lamp}
        motion={1}
        actors={EP1_SIDE}
        midOverlay={
          <DSvg>
            <rect x={-600} y={238} width={3200} height={12} rx={6} fill="#a8a294" opacity={lamp} />
            <Gleb x={1230} y={1000} scale={0.64} view="three_quarter" lod={2} frame={frame} fog={1 - lamp} pose={{armL: [40, 100], armR: [168, 6], handR: 'fist', headPitch: 0.6, headTilt: 6}} />
          </DSvg>
        }
      />
    </Stage25D>
  );
};

const WatchClose: React.FC<{dur: number}> = ({dur}) => {
  const frame = useCurrentFrame();
  // секундная стрелка приходит к 18:47:00 ровно на склейке с ударом
  const s = 60 - (dur - frame) / 30;
  return <WatchShot h={18} m={46} s={Math.min(59.99, s)} zoom={1.05 + frame * 0.0008} />;
};
