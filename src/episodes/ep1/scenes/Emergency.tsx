import React from 'react';
import {AbsoluteFill, interpolate, Sequence, useCurrentFrame} from 'remotion';
import {DSvg, Layer, Stage25D} from '../../../components/Stage25D';
import {Dust, Halation} from '../../../components/FX';
import {Subtitle} from '../../../components/Text';
import {CarCorridor} from '../../../components/Props/MetroCar';
import {PASSENGER_POSES} from '../../../components/Characters/Passenger';
import {POSES} from '../../../components/Characters/Rig';
import {camKeys, handheld} from '../../../lib/camera';
import {makeProjector} from '../../../lib/persp';
import {Snd} from '../../common/audio';
import {CorridorActor, corridorItems} from '../../common/sets';
import {PhonesShot} from '../../common/closeups';

/** Вагон после удара: кто сидит, кто на полу. */
export const EP1_AFTER: CorridorActor[] = [
  {id: 'office', side: -1, z: 2.3, pose: POSES.sitSlumped},
  {id: 'olga', side: -1, z: 3.1, pose: {...POSES.sitSide, armL: [-30, 150], armR: [-30, 150], headPitch: 0.6, shrug: 0.15}},
  {id: 'nina', side: -1, z: 6.1, extra: {ep: 1}, pose: {hipDrop: 1.42, legL: [88, 88], legR: [84, 86], armL: [20, 70], armR: [16, 75], sit: true}},
  {id: 'student', side: -1, z: 7.4, pose: POSES.sitSlumped},
  {id: 'oldman', side: -1, z: 11.6, pose: POSES.sitSlumped},
  {id: 'semyon', side: -1, z: 12.6},
  {id: 'akhmed', side: 1, z: 2.7, pose: PASSENGER_POSES.sit_floor_backpack, stand: 0.75},
  {id: 'puffer', side: 1, z: 6.6, pose: POSES.sitSlumped},
  {id: 'business', side: 1, z: 8.1},
  {id: 'korneev', side: 1, z: 9.9, stand: 0.5, pose: {armL: [20, 10], armR: [30, 40]}},
  {id: 'worker', side: -1, z: 5.4, stand: -0.35, pose: PASSENGER_POSES.sit_floor_backpack},
  {id: 'teen', side: 1, z: 4.3, pose: POSES.sitSlumped},
];

export const RedCorridor: React.FC<{z0: number; z1: number; dur: number; id: string; extra?: CorridorActor[]; dust?: boolean}> = ({z0, z1, dur, id, extra = [], dust = true}) => {
  const frame = useCurrentFrame();
  const z = interpolate(frame, [0, dur], [z0, z1]);
  const pcam = {x: 0.1, y: 0.05, z, f: 900};
  const pr = makeProjector(pcam);
  const flick = 0.85 + Math.sin(frame / 3.1) * 0.05 + (frame % 97 < 3 ? -0.4 : 0);
  return (
    <Stage25D cam={handheld(camKeys(frame, [{f: 0}]), frame, 3, id)}>
      <Layer z={1}>
        <CarCorridor id={id} pcam={pcam} light="emergency" lamp={flick} emergencyLamp={flick} fog="#060101" fogEnd={17} items={corridorItems([...EP1_AFTER, ...extra], 'emergency', frame, 0.8)} />
        {dust ? (
          <DSvg>
            {[4.25, 9.85, 15.45].map((zz, i) => {
              const [x, y] = pr.P(0, -0.65, zz);
              const s = pr.scaleAt(zz);
              if (s <= 0 || zz < z + 0.4) return null;
              return (
                <g key={i}>
                  <polygon points={`${x - s * 0.15},${y} ${x + s * 0.15},${y} ${x + s * 0.9},${y + s * 2.3} ${x - s * 0.9},${y + s * 2.3}`} fill="#B3261E" opacity={0.07 * flick} />
                  <Dust seed={`${id}d${i}`} count={40} x={x - s * 0.7} y={y} w={s * 1.4} h={s * 2.2} color="#d0a090" size={[0.8, 2.2]} fall={0.5} opacity={0.6} />
                </g>
              );
            })}
            <Halation id={`${id}-h`} glows={[{x: 960, y: 300, r: 500, color: '#B3261E', a: 0.12}]} intensity={flick} />
          </DSvg>
        ) : null}
      </Layer>
    </Stage25D>
  );
};

/** 1:25–1:50. Красный аварийный свет, пыль в лучах, интерком, оповещение, телефоны 18:47. */
export const Ep1Emergency: React.FC<{dur: number}> = ({dur}) => (
  <AbsoluteFill>
    <Sequence durationInFrames={430}>
      <RedCorridor z0={-1.2} z1={0.6} dur={430} id="emr" />
    </Sequence>
    <Sequence from={430} durationInFrames={dur - 430}>
      <PhonesShot />
    </Sequence>
    <Subtitle voice="E1-05" who="ПАВЕЛ" text="Без паники. Связи нет. Ждём." start={40} end={175} />
    <Subtitle text="…режим радиационной опасности…" italic start={205} end={300} />
    <Subtitle text="…гермозатворы закрыты…" italic start={305} end={390} />
    <Subtitle text="…оставайтесь на местах…" italic start={395} end={480} />
    <Snd src="tunnel_drone.wav" dur={dur} vol={0.42} loop trim={300} />
    <Snd src="announcement_bed.wav" from={20} dur={170} vol={0.5} fadeOut={10} />
    <Snd src="announcement_bed.wav" from={195} dur={300} vol={0.55} trim={120} fadeIn={6} fadeOut={20} />
    <Snd src="breath_close.wav" from={430} dur={dur - 430} vol={0.18} loop />
  </AbsoluteFill>
);
