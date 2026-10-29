import React from 'react';
import {AbsoluteFill, interpolate, Sequence, useCurrentFrame} from 'remotion';
import {DSvg, Layer, Stage25D} from '../../../components/Stage25D';
import {FlashlightMask} from '../../../components/FX';
import {Passage, PASS} from '../../../components/Props/Passage';
import {ShaftAsh, ShaftBack} from '../../../components/Props/VentShaft';
import {Blind} from '../../../components/Characters/Blind';
import {CoatFigure} from '../../../components/Characters/CoatFigure';
import {Nina} from '../../../components/Characters/Nina';
import {Passenger, PASSENGER_POSES} from '../../../components/Characters/Passenger';
import {CAM0, camKeys, handheld, rumble} from '../../../lib/camera';
import {Snd} from '../../common/audio';
import {placeAt} from '../../common/cast';
import {HornHand, strobe, Windshield} from '../shared';

/** Проход к шахте: пассажиры вжались в стены, слепые идут мимо на звук. Пятнадцатый останавливается у Нины. */
const PassageMontage: React.FC = () => {
  const frame = useCurrentFrame();
  const pcam = {x: 0, y: -0.05, z: 0, f: 880};
  const people: [string, number, number][] = [
    ['olga', -0.62, 3.0],
    ['akhmed', 0.62, 3.6],
    ['student', -0.62, 5.0],
    ['teen', 0.62, 5.6],
    ['worker', 0.62, 7.0],
  ];
  const ninaZ = 4.2;
  const coatZ = interpolate(frame, [0, 90, 170, 270], [11, ninaZ, ninaZ, 0.6], {extrapolateRight: 'clamp'});
  const coatTilt = interpolate(frame, [95, 110, 160, 172], [0, 22, 22, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const blindZ = (i: number) => 13 - ((frame * 0.05 + i * 2.6) % 13);
  return (
    <Stage25D cam={handheld({...CAM0}, frame, 2, 'pm')}>
      <Layer z={1}>
        <Passage
          pcam={pcam}
          light="flashlight"
          endGlow={0.45}
          items={[
            ...people.map(([id, x, z]) => ({
              z,
              render: (pr: Parameters<NonNullable<React.ComponentProps<typeof Passage>['items']>[number]['render']>[0]) => {
                const p = placeAt(pr, x, PASS.FLOOR, z, 1.5, 16);
                return <Passenger type={id as 'olga'} seed={`cast-${id}`} x={p.x} y={p.y} scale={p.scale} view="front" lod={1} light="flashlight" fog={p.fog} wrapped dirt={0.8} frame={frame} pose={{shrug: 0.12, armL: [-2, 4], armR: [-2, 4]}} />;
              },
            })),
            {
              z: ninaZ,
              render: (pr) => {
                const p = placeAt(pr, -0.6, PASS.FLOOR, ninaZ, 1.5, 16);
                return <Nina x={p.x} y={p.y} scale={p.scale} view="front" lod={2} light="flashlight" episode={5} fog={p.fog} frame={frame} pose={{shrug: 0.1, armL: [-2, 4], armR: [-2, 4]}} />;
              },
            },
            ...[0, 1, 2, 3].map((i) => ({
              z: blindZ(i),
              render: (pr: Parameters<NonNullable<React.ComponentProps<typeof Passage>['items']>[number]['render']>[0]) => {
                const z = blindZ(i);
                const p = placeAt(pr, 0.05 * (i % 2 ? 1 : -1), PASS.FLOOR, z, 1.5, 16);
                return <Blind x={p.x} y={p.y} scale={p.scale} seed={`pmb${i}`} kind="C" view="front" walkT={(frame / 30 + i * 0.3) % 1} light="flashlight" fog={p.fog} lod={1} />;
              },
            })),
            {
              z: coatZ,
              render: (pr) => {
                const p = placeAt(pr, -0.1, PASS.FLOOR, coatZ, 1.5, 16);
                return <CoatFigure x={p.x} y={p.y} scale={p.scale} view="front" headUp light="flashlight" fog={p.fog} lod={2} puddle={false} frame={frame} pose={{headTilt: -coatTilt, headYaw: coatTilt > 1 ? -0.5 : 0}} />;
              },
            },
          ]}
        />
      </Layer>
      <FlashlightMask id="pmm" darkness={0.9} beams={[{sx: 960, sy: 200, tx: 960, ty: 560, r: 640, intensity: 0.75, stretch: 1.2}]} haze={0.03} />
    </Stage25D>
  );
};

/** Шахта: пассажиры лезут по лестнице вверх, сверху падает пепел. */
const Climb: React.FC = () => {
  const frame = useCurrentFrame();
  const up = frame * 3.2;
  const climbers: [string, number][] = [
    ['olga', 0],
    ['akhmed', 260],
    ['student', 520],
  ];
  return (
    <Stage25D cam={handheld(camKeys(frame, [{f: 0, y: -120}, {f: 250, y: -260}]), frame, 2, 'clb')} fogEnd={9}>
      <Layer z={2.3}>
        <ShaftBack light="flashlight" id="clbk" />
      </Layer>
      <Layer z={2.25}>
        <DSvg>
          {climbers.map(([id, off], i) => (
            <Passenger
              key={id}
              type={id as 'olga'}
              seed={`cast-${id}`}
              x={960}
              y={1180 + off * 0.8 - up}
              scale={0.42}
              view="back"
              lod={1}
              light="flashlight"
              wrapped
              frame={frame}
              pose={{...PASSENGER_POSES.climb_ladder, armL: [170 - ((frame / 6 + i * 3) % 2) * 20, 10], legL: [40 - ((frame / 6 + i * 3) % 2) * 30, 60]}}
            />
          ))}
        </DSvg>
      </Layer>
      <Layer z={1.6}>
        <ShaftAsh seed="clash" count={200} opacity={0.9} />
      </Layer>
      <FlashlightMask id="clm" darkness={0.86} beams={[{sx: 960, sy: -400, tx: 960, ty: 400, r: 560, intensity: 0.7, color: '#9a9e9a', stretch: 1.6}]} haze={0.15} />
    </Stage25D>
  );
};

/** 1:40–2:15. Гудок. Кадр трясётся, строб. Слепые идут к поезду; параллельный монтаж — проход и лестница. */
export const Ep5Horn: React.FC<{dur: number}> = ({dur}) => {
  const frame = useCurrentFrame();
  const s = strobe(frame, 12, 5);
  const windshield = (a: number, b: number, from: number) => (
    <Sequence from={from} durationInFrames={b - a}>
      <WindshieldRun offset={a} s={s} />
    </Sequence>
  );
  return (
    <AbsoluteFill>
      <Sequence durationInFrames={60}>
        <Windshield frame={frame} cam={rumble(handheld({...CAM0, zoom: 1.12}, frame, 2, 'hh'), frame, frame > 20 ? 7 : 0)} crowd={0.6} approach={0.3} strobeK={frame > 20 ? s : 0.2} hand={<HornHand squeeze={1} strobeK={frame > 20 ? s : 0.2} hornDown={frame > 20 ? 1 : 0} />} hornDown={frame > 20 ? 1 : 0} />
      </Sequence>
      {windshield(60, 330, 60)}
      <Sequence from={330} durationInFrames={270}>
        <PassageMontage />
      </Sequence>
      {windshield(600, 800, 600)}
      <Sequence from={800} durationInFrames={dur - 800}>
        <Climb />
      </Sequence>
      <Snd src="horn.wav" from={20} dur={dur - 20} loop vol={(f) => {
        const g = f + 20;
        // гудок в файле около −4 dBFS: на полной громкости он задавливал всю серию (−6 LUFS) — держим ниже голоса
        return g < 330 || (g >= 600 && g < 800) ? 0.34 : 0.12;
      }} />
      {/* лестница: удары ботинок по железным перекладинам и шорох одежды, пока лезут */}
      {Array.from({length: Math.max(0, Math.floor((dur - 810) / 38))}).map((_, i) => (
        <Snd key={`rung${i}`} src="knock.wav" from={810 + i * 38} dur={20} vol={0.22 + (i % 3) * 0.05} rate={1.3 + (i % 2) * 0.2} />
      ))}
      <Snd src="drip.wav" from={880} dur={14} vol={0.35} />
      <Snd src="scrape.wav" from={960} dur={40} vol={0.2} />
      <Snd src="shuffle.wav" from={60} dur={dur - 60} vol={0.45} loop rate={1.4} />
    </AbsoluteFill>
  );
};

const WindshieldRun: React.FC<{offset: number; s: number}> = ({offset, s}) => {
  const lf = useCurrentFrame();
  const f = lf + offset;
  // сначала медленно, потом быстрее
  const approach = interpolate(f, [60, 330, 600, 800], [0.3, 0.75, 0.75, 1.25], {extrapolateRight: 'clamp'});
  const walk = f < 330 ? 1 / 36 : 1 / 15;
  return <Windshield frame={f} cam={rumble(handheld({...CAM0}, f, 2, 'wr'), f, 6)} crowd={1} approach={approach} walk={walk} strobeK={s} hornDown={1} />;
};
