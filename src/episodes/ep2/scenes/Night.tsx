import React from 'react';
import {AbsoluteFill, interpolate, useCurrentFrame} from 'remotion';
import {Stage25D} from '../../../components/Stage25D';
import {PencilNumber, Timestamp} from '../../../components/Text';
import {camKeys, handheld} from '../../../lib/camera';
import {Snd} from '../../common/audio';
import {Actor} from '../../common/cast';
import {CarSideLayers, SIDE_FEET} from '../../common/sets';
import {lie} from '../cast';

const S = 0.41;
const BENCH_Y = 640;
const FLOOR_Y = SIDE_FEET + 105;
// все лежат: на скамьях и на полу
const SLEEPERS: Actor[] = ([
  {id: 'office', x: -60, y: BENCH_Y, scale: S, pose: lie(1)},
  {id: 'olga', x: 560, y: BENCH_Y, scale: S, pose: lie(1)},
  {id: 'student', x: 680, y: BENCH_Y, scale: S, pose: lie(-1)},
  {id: 'oldman', x: 1500, y: BENCH_Y, scale: S, pose: lie(1)},
  {id: 'puffer', x: 1620, y: BENCH_Y, scale: S, pose: lie(-1)},
  {id: 'worker', x: 330, y: FLOOR_Y, scale: S, pose: lie(1)},
  {id: 'teen', x: 1300, y: FLOOR_Y, scale: S, pose: lie(-1)},
  {id: 'business', x: -300, y: FLOOR_Y + 10, scale: S, pose: lie(1)},
  {id: 'akhmed', x: 900, y: FLOOR_Y + 20, scale: S, pose: lie(-1)},
  {id: 'korneev', x: 2050, y: FLOOR_Y + 8, scale: S, pose: lie(1)},
  {id: 'nina', x: 2420, y: BENCH_Y, scale: S, pose: lie(1), ep: 2},
] as Actor[]).map((a) => ({...a, view: 'front' as const, dirt: 0.5}));

const KNOCK0 = 60;
const KNOCK_GAP = 16;
const FIFTEEN = 345;
// где появляются карандашные цифры (в координатах стены)
const SPOTS: [number, number][] = [
  [260, 560],
  [440, 860],
  [640, 540],
  [820, 840],
  [1000, 560],
  [1160, 540],
  [1380, 860],
  [1580, 600],
  [1780, 840],
  [1960, 560],
  [2100, 560],
  [2280, 880],
  [2500, 860],
  [2820, 560],
];

/** 2:25–2:50. День 3, 02:40. Все лежат. Из-под пола — стуки, ровно, как счёт. 1…14. Пауза. 15. Вскрик из кабины. */
export const Ep2Night: React.FC<{dur: number}> = ({dur}) => {
  const frame = useCurrentFrame();
  const cam = handheld(camKeys(frame, [{f: 0, x: 900, dolly: 0.0}, {f: dur, x: 500, dolly: 0.12}]), frame, 1.5, 'nt');
  return (
    <AbsoluteFill>
      <Stage25D cam={cam} fogEnd={10}>
        <CarSideLayers
          frame={frame}
          id="nt"
          light="dark"
          lamp={1}
          emergencyLamp={0.16}
          actors={SLEEPERS}
          dirt={0.7}
          coatsOnFloor
          poles={false}
          wallOverlay={
            <>
              {SPOTS.map(([x, y], i) => (
                <PencilNumber key={i} x={x} y={y} text={String(i + 1)} at={KNOCK0 + i * KNOCK_GAP} size={64} color="#8a867c" writeFrames={4} />
              ))}
              <PencilNumber x={560} y={400} text="15" at={FIFTEEN} size={96} color="#a39d90" tremble={3} writeFrames={6} />
            </>
          }
        />
      </Stage25D>
      <Timestamp text="ДЕНЬ 3 — 02:40" start={0} end={dur} />
      <Snd src="tunnel_drone.wav" dur={dur} vol={(f) => interpolate(f, [0, 40, 330, 345, 420, dur], [0.4, 0.3, 0.3, 0.0, 0.0, 0.35], {extrapolateRight: 'clamp'})} loop trim={110} />
      {Array.from({length: 14}).map((_, i) => (
        <Snd key={i} src="knock.wav" from={KNOCK0 + i * KNOCK_GAP} dur={30} vol={0.75} />
      ))}
      <Snd src="knock.wav" from={FIFTEEN} dur={30} vol={1} />
      <Snd src="cry_short.wav" from={FIFTEEN + 30} dur={12} vol={0.9} fadeOut={2} />
    </AbsoluteFill>
  );
};
