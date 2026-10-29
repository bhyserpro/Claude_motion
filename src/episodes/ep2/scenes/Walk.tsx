import React from 'react';
import {AbsoluteFill, interpolate, useCurrentFrame} from 'remotion';
import {Subtitle} from '../../../components/Text';
import {useWordFrame} from '../../../components/Voice';
import {Gleb} from '../../../components/Characters/Gleb';
import {Semyon, SEMYON_POSES} from '../../../components/Characters/Semyon';
import {walkPose} from '../../../components/Characters/Rig';
import {TUN} from '../../../components/Props/Tunnel';
import {camKeys, handheld} from '../../../lib/camera';
import {Snd} from '../../common/audio';
import {placeAt} from '../../common/cast';
import {TunnelShot} from '../../common/tunnelShot';

export const PASSAGE_Z = 9;

/**
 * Глеб и Семён идут по туннелю (E2-03). На «Слышишь?» Семён встаёт — гул туннеля пропадает (E2-N03),
 * на «Плохо это» идут дальше; у прохода «ВШ-12» он показывает вентшахту (E2-04).
 */
export const Ep2Walk: React.FC<{dur: number}> = ({dur}) => {
  const frame = useCurrentFrame();
  const listen = useWordFrame('E2-N03', 'Слышишь', 140) - 4;
  const resume = useWordFrame('E2-N03', 'Плохо', 300) + 10;
  const stop0 = useWordFrame('E2-04', 'Вентшахта', 350) - 12;
  const stop1 = useWordFrame('E2-04', 'замке', 450) + 25; // у реплики длинный хвост эха — считаем от последнего слова
  // идут → слушают → идут → у прохода → идут дальше
  const zt = (f: number) =>
    interpolate(f, [0, listen, resume, stop0, stop1, dur], [0, 2.4, 2.4, 5.4, 5.4, 6.8], {extrapolateRight: 'clamp'});
  const camZ = zt(frame) - 0.6;
  const walking = frame < listen || (frame >= resume && frame < stop0) || frame >= stop1;
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
      <Subtitle voice="E2-03" who="СЕМЁН" text="До гермы двести метров. Я тут тридцать лет ходил." />
      <Subtitle voice="E2-N03" who="СЕМЁН" text="Слышишь? Туннель всегда гудит. А сейчас молчит. Плохо это." />
      <Subtitle voice="E2-04" who="СЕМЁН" text="Вентшахта. Наверх ведёт. Решётка там на замке." />
      {/* гул туннеля пропадает, пока Семён слушает */}
      <Snd
        src="tunnel_drone.wav"
        dur={dur}
        vol={(f) => interpolate(f, [listen - 6, listen + 10, resume + 20, resume + 60], [0.5, 0.06, 0.06, 0.5], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'})}
        loop
        trim={40}
      />
      <Snd src="shuffle.wav" dur={listen} vol={0.45} loop />
      <Snd src="shuffle.wav" from={resume} dur={stop0 - resume} vol={0.45} loop trim={30} />
      <Snd src="shuffle.wav" from={stop1} dur={dur - stop1} vol={0.45} loop trim={60} />
      <Snd src="drip.wav" from={listen + 50} dur={14} vol={0.35} />
      <Snd src="knock.wav" from={resume + 30} dur={20} vol={0.18} />
      <Snd src="knock.wav" from={resume + 45} dur={20} vol={0.15} />
    </AbsoluteFill>
  );
};
