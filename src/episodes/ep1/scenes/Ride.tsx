import React from 'react';
import {AbsoluteFill, interpolate, useCurrentFrame} from 'remotion';
import {DSvg, Stage25D} from '../../../components/Stage25D';
import {Monologue, Timestamp} from '../../../components/Text';
import {camKeys, handheld} from '../../../lib/camera';
import {Snd} from '../../common/audio';
import {CarSideLayers} from '../../common/sets';
import {EP1_SIDE} from '../cast';
import {Gleb} from '../../../components/Characters/Gleb';

/** 0:07–0:30. Вагон сбоку, тёплый свет, медленный наезд на Глеба. */
export const Ep1Ride: React.FC<{dur: number}> = ({dur}) => {
  const frame = useCurrentFrame();
  const cam = handheld(
    camKeys(frame, [
      {f: 0, x: -60, dolly: 0, zoom: 1},
      {f: dur, x: 220, dolly: 0.32, zoom: 1.02},
    ]),
    frame,
    3,
    'ride',
  );
  // «неправильная» деталь: в тёмном стекле на 18 кадров отражается лишняя бледная голова
  const ghost = frame > 470 && frame < 488 ? 1 : 0;
  return (
    <AbsoluteFill>
      <Stage25D cam={cam} fogEnd={10}>
        <CarSideLayers
          frame={frame}
          id="ride"
          light="warm"
          motion={1}
          actors={EP1_SIDE}
          glass={(w, i) =>
            i === 9 && ghost ? <ellipse cx={w.x + w.w * 0.6} cy={w.y + w.h * 0.45} rx={26} ry={30} fill="#cfc9bc" opacity={0.18} /> : null
          }
          mid={[]}
          midOverlay={
            <DSvg>
              <rect x={-600} y={238} width={3200} height={12} rx={6} fill="#a8a294" />
              {[700, 1000, 1340, 1650].map((x) => (
                <path key={x} d={`M${x},250 l-14,70 a20,20 0 1,0 28,0 Z`} fill="#2a2a28" />
              ))}
              <Gleb x={1230} y={1000} scale={0.64} view="three_quarter" lod={2} frame={frame} pose={{armL: [4, 8], armR: [168, 6], handR: 'fist', headPitch: 0.25}} />
            </DSvg>
          }
        />
      </Stage25D>
      <Timestamp text="ДЕНЬ 0 — 18:39" start={0} end={dur} />
      <Monologue start={40} end={320} lines={['Двадцать лет я оцениваю убытки.']} />
      <Monologue start={340} end={dur - 6} lines={['Пожар, потоп, авария. Я прихожу после.', 'Считаю, что осталось.']} />
      <Snd src="hit.wav" dur={60} vol={0.8} />
      <Snd src="rails_loop.wav" dur={dur} vol={0.7} loop />
      <Snd src="tunnel_drone.wav" dur={dur} vol={(f) => 0.3 + interpolate(f, [0, dur], [0, 0.05])} loop />
    </AbsoluteFill>
  );
};
