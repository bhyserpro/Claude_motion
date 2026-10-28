import React from 'react';
import {AbsoluteFill, interpolate, useCurrentFrame} from 'remotion';
import {DSvg, Layer, Stage25D} from '../../../components/Stage25D';
import {Dust} from '../../../components/FX';
import {Subtitle, Timestamp} from '../../../components/Text';
import {CityFar, CityMid, CitySky, CityStreet, ShaftKiosk} from '../../../components/Props/City';
import {Nina} from '../../../components/Characters/Nina';
import {Passenger} from '../../../components/Characters/Passenger';
import {walkPose} from '../../../components/Characters/Rig';
import {camKeys, handheld} from '../../../lib/camera';
import {Snd} from '../../common/audio';

/** 2:40–2:55. Поверхность. Мёртвый серый город. Часы стоят на 18:47. «…оставайтесь на местах…» */
export const Ep5Surface: React.FC<{dur: number}> = ({dur}) => {
  const frame = useCurrentFrame();
  const cam = handheld(camKeys(frame, [{f: 0, x: 120, dolly: 0.25, y: 20}, {f: dur, x: -160, dolly: 0.0, y: 0}]), frame, 1.5, 'srf');
  const out = (i: number) => interpolate(frame, [20 + i * 40, 90 + i * 40], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const turn = frame > 240;
  const walkers: [string, number][] = [
    ['olga', 0],
    ['akhmed', 1],
    ['student', 2],
    ['teen', 3],
  ];
  return (
    <AbsoluteFill>
      <Stage25D cam={cam} fog="#8b8a82" fogStart={2} fogEnd={14} bg="#6e6c66">
        <Layer z={12} fog={0}>
          <CitySky id="sky" />
        </Layer>
        <Layer z={7} fog={0.45}>
          <CityFar />
        </Layer>
        <Layer z={3.6} fog={0.22}>
          <CityMid />
        </Layer>
        <Layer z={6}>
          <DSvg>
            <Dust seed="snow-far" count={150} x={-600} y={-200} w={3100} h={1400} color="#c9c6bc" size={[1, 2.5]} fall={0.9} drift={0.6} opacity={0.6} flakes />
          </DSvg>
        </Layer>
        <Layer z={2} fog={0.08}>
          <CityStreet />
        </Layer>
        <Layer z={1.25} fog={0}>
          <ShaftKiosk />
          <DSvg>
            {walkers.map(([id, i]) => {
              const k = out(i);
              if (k <= 0) return null;
              const x = 1460 - 80 + interpolate(k, [0, 1], [0, -380 - i * 170]);
              return (
                <Passenger key={id} type={id as 'olga'} seed={`cast-${id}`} x={x} y={1010} scale={0.5} view="three_quarter" facing={-1} lod={1} light="warm" wrapped dirt={0.9} ash={0.8} frame={frame} fog={0.25} fogColor="#8b8a82" pose={walkPose((frame / 34 + i * 0.25) % 1, 0.6)} opacity={Math.min(1, k * 3)} />
              );
            })}
            <Nina x={1150} y={1010} scale={0.5} view={turn ? 'three_quarter' : 'back'} facing={1} lod={2} light="warm" episode={5} ash={0.8} fog={0.2} fogColor="#8b8a82" frame={frame} pose={turn ? {armL: [4, 6], armR: [4, 6], headYaw: 0.4} : walkPose((frame / 34) % 1, 0.5)} opacity={Math.min(1, out(4) * 3)} />
          </DSvg>
        </Layer>
        <Layer z={0.9}>
          <DSvg>
            <Dust seed="snow-near" count={70} x={-600} y={-200} w={3100} h={1400} color="#d6d3c9" size={[2, 5]} fall={2.2} drift={0.9} opacity={0.8} flakes />
          </DSvg>
        </Layer>
      </Stage25D>
      <Timestamp text="ДЕНЬ 7 — 18:47" start={0} end={dur} />
      <Subtitle text="…оставайтесь на местах…" italic start={140} end={280} />
      <Subtitle text="…оставайтесь на местах…" italic start={300} end={dur - 6} />
      <Snd src="announcement_bed.wav" from={120} dur={dur - 120} vol={0.5} trim={140} />
      <Snd src="tunnel_drone.wav" dur={dur} vol={0.25} loop trim={10} />
      <Snd src="shuffle.wav" dur={240} vol={0.25} loop />
    </AbsoluteFill>
  );
};
