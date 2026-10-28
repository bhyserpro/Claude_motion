import React from 'react';
import {AbsoluteFill, interpolate, useCurrentFrame} from 'remotion';
import {Subtitle} from '../../../components/Text';
import {Gleb} from '../../../components/Characters/Gleb';
import {Semyon, SEMYON_POSES} from '../../../components/Characters/Semyon';
import {walkPose} from '../../../components/Characters/Rig';
import {TUN} from '../../../components/Props/Tunnel';
import {camKeys, handheld} from '../../../lib/camera';
import {Snd} from '../../common/audio';
import {placeAt} from '../../common/cast';
import {TunnelShot} from '../../common/tunnelShot';

export const PASSAGE_Z = 9;

/** 0:35–0:55. Глеб и Семён идут по туннелю. Боковой проход «ВШ-12». */
export const Ep2Walk: React.FC<{dur: number}> = ({dur}) => {
  const frame = useCurrentFrame();
  const stop0 = 250;
  const stop1 = 400;
  // идут, останавливаются у прохода, идут дальше
  const zt = (f: number) =>
    f < stop0 ? interpolate(f, [0, stop0], [0, 5.4]) : f < stop1 ? 5.4 : interpolate(f, [stop1, dur], [5.4, 8.6]);
  const camZ = zt(frame) - 0.6;
  const walking = frame < stop0 || frame >= stop1;
  const phase = (frame / 34) % 1;
  const zS = camZ + 3.2;
  const zG = camZ + 2.4;
  const pcam = {x: 0.1, y: -0.05, z: camZ, f: 920};
  const pointing = frame >= stop0 + 10 && frame < stop1 - 10;
  return (
    <AbsoluteFill>
      <TunnelShot
        id="wk"
        pcam={pcam}
        cam={handheld(camKeys(frame, [{f: 0}]), frame, 3.5, 'wk')}
        passageZ={PASSAGE_Z}
        items={(pr) => [
          {
            z: zS,
            render: () => {
              const p = placeAt(pr, -0.9, TUN.FLOOR, zS, 2, 34);
              return pointing ? (
                <Semyon x={p.x} y={p.y} scale={p.scale} view="three_quarter" facing={-1} light="flashlight" frame={frame} pose={SEMYON_POSES.point} holdR="flashlightWarm" />
              ) : (
                <Semyon x={p.x} y={p.y} scale={p.scale} view="back" light="flashlight" frame={frame} pose={walking ? walkPose(phase, 0.6, SEMYON_POSES.walk_tunnel) : SEMYON_POSES.walk_tunnel} holdR="flashlightWarm" />
              );
            },
          },
          {
            z: zG,
            render: () => {
              const p = placeAt(pr, 0.55, TUN.FLOOR, zG, 2, 34);
              return <Gleb x={p.x} y={p.y} scale={p.scale} view="back" episode={2} light="flashlight" frame={frame} pose={walking ? walkPose((phase + 0.4) % 1, 0.7, {armR: [30, 20]}) : {armR: [30, 20]}} holdR="flashlight" />;
            },
          },
        ]}
        beams={[
          {x: pointing ? -2.3 : 0.3, y: pointing ? -0.45 : 1.0, z: pointing ? PASSAGE_Z - 0.6 : zG + 6, r: pointing ? 1.0 : 2.0, intensity: 1, sx: 1180, sy: 640},
          {x: -0.6, y: 0.9, z: zS + 5, r: 1.8, intensity: 0.75, sx: 820, sy: 600, color: '#E8D3A0'},
          // рассеянный свет от их фонарей на них самих
          {x: -0.1, y: 0.4, z: (zS + zG) / 2, r: 1.3, intensity: 0.5, sx: 960, sy: 1150},
        ]}
        darkness={0.975}
      />
      <Subtitle who="СЕМЁН" text="Вентшахта. Наверх ведёт. Решётка там на замке." start={stop0 + 20} end={stop1} />
      <Subtitle who="СЕМЁН" text="До гермы двести метров. Я тут тридцать лет ходил." start={stop1 + 20} end={dur - 10} />
      <Snd src="tunnel_drone.wav" dur={dur} vol={0.5} loop trim={40} />
      <Snd src="shuffle.wav" dur={stop0} vol={0.45} loop />
      <Snd src="shuffle.wav" from={stop1} dur={dur - stop1} vol={0.45} loop trim={30} />
      <Snd src="knock.wav" from={120} dur={20} vol={0.18} />
      <Snd src="knock.wav" from={135} dur={20} vol={0.15} />
    </AbsoluteFill>
  );
};
