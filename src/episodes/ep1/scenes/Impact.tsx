import React from 'react';
import {AbsoluteFill, interpolate, random, Sequence, spring, useCurrentFrame} from 'remotion';
import {DSvg, Stage25D} from '../../../components/Stage25D';
import {GlassCracks} from '../../../components/FX';
import {Gleb} from '../../../components/Characters/Gleb';
import {camKeys, handheld, impact} from '../../../lib/camera';
import {Snd} from '../../common/audio';
import {Actor} from '../../common/cast';
import {CarSideLayers} from '../../common/sets';
import {WatchShot} from '../../common/closeups';
import {EP1_SIDE} from '../cast';

const HIT = 15;

/** 1:10–1:25. 18:47. Тишина 15 кадров → инфразвуковой удар, трещины, люди падают, 3 кадра белого, тьма. */
export const Ep1Impact: React.FC<{dur: number}> = ({dur}) => (
  <AbsoluteFill style={{background: '#000'}}>
    <Sequence durationInFrames={HIT}>
      <WatchShot h={18} m={47} s={0.4} zoom={1.3} />
    </Sequence>
    <Sequence from={HIT} durationInFrames={118 - HIT}>
      <Chaos />
    </Sequence>
    <Sequence from={118} durationInFrames={3}>
      <AbsoluteFill style={{background: '#F4F2EC'}} />
    </Sequence>
    <Sequence from={300} durationInFrames={dur - 300}>
      <RedFlickers />
    </Sequence>
    <Snd src="boom.wav" from={HIT} dur={210} vol={1} />
    <Snd src="scrape.wav" from={60} dur={110} vol={0.5} />
    <Snd src="cry_short.wav" from={175} dur={20} vol={0.35} />
    <Snd src="breath_close.wav" from={200} dur={dur - 200} vol={0.25} loop fadeIn={30} />
    <Snd src="tunnel_drone.wav" from={130} dur={dur - 130} vol={0.4} loop fadeIn={60} />
  </AbsoluteFill>
);

const lurch = (a: Actor, k: number, i: number): Actor => {
  const standing = a.id === 'korneev' || a.id === 'worker' || a.id === 'teen';
  const dir = 1;
  if (standing) {
    const fall = a.id === 'korneev' ? 0.35 : 1;
    return {...a, x: a.x + k * 120 * fall, y: a.y - Math.sin(k * Math.PI) * 30, pose: {...a.pose, rootRot: dir * k * 78 * fall, rootDy: k * 0.4 * fall, armL: [k * 90, 20], armR: [k * 70, 30]}};
  }
  const tilt = (18 + random(`lurch${i}`) * 22) * k;
  return {...a, x: a.x + k * 30, pose: {...a.pose, rootRot: dir * tilt, armL: [k * 50, 20], armR: [k * 30, 40], headTilt: k * 20}};
};

const Chaos: React.FC = () => {
  const frame = useCurrentFrame();
  const k = spring({frame, fps: 30, config: {damping: 9, mass: 0.7}});
  let cam = camKeys(frame, [{f: 0, x: 160, dolly: 0.15}]);
  cam = impact(cam, frame, 0, 46, 60, 'boom');
  cam = handheld(cam, frame, 5, 'chaos');
  // лампы: сумасшедшее мерцание и отказ
  const lamp = frame < 4 ? 1.4 : random(`lmp${Math.floor(frame / 2)}`) < 0.5 - frame * 0.004 ? 0.9 : 0.12;
  const motion = interpolate(frame, [0, 90], [1, 0], {extrapolateRight: 'clamp'});
  const crack = interpolate(frame, [0, 42], [0, 1], {extrapolateRight: 'clamp'});
  return (
    <Stage25D cam={cam} fogEnd={10}>
      <CarSideLayers
        frame={frame}
        id="imp"
        light="warm"
        lamp={lamp}
        motion={motion}
        actors={EP1_SIDE.map((a, i) => lurch(a, k, i))}
        glass={(w, i) =>
          i % 2 === 0 || i === 9 ? (
            <GlassCracks seed={`gc${i}`} cx={w.x + w.w * (0.3 + random(`gcx${i}`) * 0.4)} cy={w.y + w.h * (0.3 + random(`gcy${i}`) * 0.4)} radius={w.w * 0.8} progress={crack} />
          ) : null
        }
        midOverlay={
          <DSvg>
            <Gleb x={1230 + k * 90} y={1000} scale={0.64} view="three_quarter" lod={2} frame={frame} fog={1 - Math.min(1, lamp)} pose={{lean: k * 25, armL: [k * 60, 30], armR: [168 - k * 40, 6], handR: 'fist', headTilt: k * 15}} />
          </DSvg>
        }
      />
    </Stage25D>
  );
};

/** Аварийный свет пытается включиться: короткие красные вспышки в темноте. */
const RedFlickers: React.FC = () => {
  const frame = useCurrentFrame();
  const on = (frame >= 0 && frame < 3) || (frame >= 40 && frame < 42) || (frame >= 80 && frame < 92) || frame >= 120;
  const lvl = frame >= 120 ? interpolate(frame, [120, 150], [0.4, 1], {extrapolateRight: 'clamp'}) * (0.85 + random(`rf${frame}`) * 0.15) : 0.7;
  if (!on) return <AbsoluteFill style={{background: '#000'}} />;
  return (
    <Stage25D cam={handheld(camKeys(frame, [{f: 0, x: 160, dolly: 0.15}]), frame, 3, 'rfl')} fogEnd={10}>
      <CarSideLayers
        frame={frame}
        id="rfl"
        light="emergency"
        lamp={lvl}
        emergencyLamp={lvl}
        actors={EP1_SIDE.map((a, i) => lurch(a, 1, i))}
        glass={(w, i) => (i % 2 === 0 || i === 9 ? <GlassCracks seed={`gc${i}`} cx={w.x + w.w * (0.3 + random(`gcx${i}`) * 0.4)} cy={w.y + w.h * (0.3 + random(`gcy${i}`) * 0.4)} radius={w.w * 0.8} progress={1} color="#8a4a40" /> : null)}
        midOverlay={
          <DSvg>
            <Gleb x={1320} y={1000} scale={0.64} view="three_quarter" lod={2} frame={frame} light="emergency" pose={{lean: 20, armL: [50, 30], armR: [120, 6], handR: 'fist', headTilt: 12}} />
          </DSvg>
        }
      />
    </Stage25D>
  );
};
