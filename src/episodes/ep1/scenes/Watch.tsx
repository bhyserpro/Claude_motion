import React from 'react';
import {AbsoluteFill, Sequence, useCurrentFrame} from 'remotion';
import {DSvg, Stage25D} from '../../../components/Stage25D';
import {Timestamp} from '../../../components/Text';
import {Gleb} from '../../../components/Characters/Gleb';
import {camKeys, handheld} from '../../../lib/camera';
import {Snd} from '../../common/audio';
import {CarSideLayers} from '../../common/sets';
import {WatchShot} from '../../common/closeups';
import {EP1_SIDE} from '../cast';

/** 0:55–1:10. 18:46. Свет моргает один раз. Часы крупно, секундная стрелка. */
export const Ep1Watch: React.FC<{dur: number}> = ({dur}) => {
  return (
    <AbsoluteFill>
      <Sequence durationInFrames={150}>
        <BlinkWide />
      </Sequence>
      <Sequence from={150} durationInFrames={dur - 150}>
        <WatchClose />
      </Sequence>
      <Timestamp text="ДЕНЬ 0 — 18:46" start={0} end={dur} />
      <Snd src="rails_loop.wav" dur={dur} vol={0.62} loop trim={120} />
      <Snd src="tunnel_drone.wav" dur={dur} vol={0.32} loop trim={400} />
      <Snd src="noise_cut.wav" from={80} dur={14} vol={0.35} />
    </AbsoluteFill>
  );
};

const BlinkWide: React.FC = () => {
  const frame = useCurrentFrame();
  const lamp = frame >= 80 && frame < 85 ? 0.12 : frame >= 85 && frame < 87 ? 0.6 : 1;
  const cam = handheld(camKeys(frame, [{f: 0, x: 120, dolly: 0.18}, {f: 150, x: 160, dolly: 0.22}]), frame, 2.5, 'blk');
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

const WatchClose: React.FC = () => {
  const frame = useCurrentFrame();
  // 18:46:50 → 18:47:00 в конце сцены
  const s = 50 + frame / 30;
  return <WatchShot h={18} m={46} s={Math.min(59.99, s)} zoom={1.05 + frame * 0.0008} />;
};
