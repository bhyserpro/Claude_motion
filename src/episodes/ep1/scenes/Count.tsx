import React from 'react';
import {AbsoluteFill, interpolate, Sequence, useCurrentFrame} from 'remotion';
import {Layer, Stage25D} from '../../../components/Stage25D';
import {Monologue, PencilNumber} from '../../../components/Text';
import {CarCorridor, CarOutside} from '../../../components/Props/MetroCar';
import {Pavel, PAVEL_POSES} from '../../../components/Characters/Pavel';
import {Gleb} from '../../../components/Characters/Gleb';
import {camKeys, CAM0, handheld} from '../../../lib/camera';
import {Snd} from '../../common/audio';
import {useWordFrame} from '../../../components/Voice';
import {CarSideLayers, corridorItems} from '../../common/sets';
import {EP1_CORRIDOR, EP1_COUNT_ORDER, EP1_SIDE} from '../cast';

const PAN_A = -2300;
const STANDING = new Set(['korneev', 'worker', 'teen']);
const NUMBERS = ['Один', 'Два', 'Три', 'Четыре', 'Пять', 'Шесть', 'Семь', 'Восемь', 'Девять', 'Десять'];

/** Камера: при каком x камеры человек с центром x проходит правее центра кадра (там и пишется его номер). */
const camAt = (x: number) => (x - 1150) * 1.48;

/**
 * POV Глеба: счёт пассажиров вслух 1…12 (E1-N02 + E1-03) — цифра пишется в момент, когда её произносят,
 * панорама идёт за счётом; «тринадцать» — Павел в стекле кабины, «четырнадцать» — своё отражение, затем E1-04.
 */
export const Ep1Count: React.FC<{dur: number}> = ({dur}) => {
  const fallback = (i: number) => 20 + i * 30;
  const at = [
    ...NUMBERS.map((w, i) => useWordFrame('E1-N02', w, fallback(i))),
    useWordFrame('E1-03', 'Одиннадцать', fallback(10)),
    useWordFrame('E1-03', 'двенадцать', fallback(11)),
  ];
  const cab = useWordFrame('E1-03', 'тринадцать', fallback(12));
  const self = useWordFrame('E1-03', 'четырнадцать', fallback(13));
  const mono = useWordFrame('E1-04', 'Четырнадцать', self + 30);
  return (
    <AbsoluteFill>
      <Sequence durationInFrames={cab}>
        <SidePan at={at} dur={cab} />
      </Sequence>
      <Sequence from={cab} durationInFrames={self - cab}>
        <CabGlance dur={self - cab} />
      </Sequence>
      <Sequence from={self} durationInFrames={dur - self}>
        <Reflection />
      </Sequence>
      <Monologue voice="E1-04" start={mono - 2} end={dur} lines={['Четырнадцать. Я всегда считаю.', 'Привычка. Потом проще описывать ущерб.']} />
      <Snd src="rails_loop.wav" dur={dur} vol={0.6} loop trim={60} />
      <Snd src="tunnel_drone.wav" dur={dur} vol={0.3} loop trim={200} />
    </AbsoluteFill>
  );
};

const SidePan: React.FC<{at: number[]; dur: number}> = ({at, dur}) => {
  const frame = useCurrentFrame();
  // ключи панорамы: к моменту каждого числа нужный человек стоит правее центра
  const keys = EP1_COUNT_ORDER.map((p, i) => [at[i], camAt(p.x)] as [number, number]);
  const f = [0, ...keys.map((k) => k[0]), dur];
  const xs = [Math.min(PAN_A, keys[0][1] - 140), ...keys.map((k) => k[1]), keys[keys.length - 1][1] + 160];
  const camX = interpolate(frame, f, xs, {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const cam = handheld({...CAM0, x: camX, dolly: 0.12}, frame, 2.5, 'cnt');
  return (
    <Stage25D cam={cam} fogEnd={10}>
      <CarSideLayers
        frame={frame}
        id="cnt"
        light="warm"
        motion={1}
        actors={EP1_SIDE.map((a) => (a.id === 'nina' ? {...a, lod: 2} : a))}
        wallOverlay={
          <>
            {EP1_COUNT_ORDER.map((p, i) => (
              <PencilNumber key={p.id} x={p.x + 10} y={STANDING.has(p.id) ? 300 : 392} text={String(i + 1)} at={Math.max(0, at[i] - 1)} size={70} />
            ))}
          </>
        }
      />
    </Stage25D>
  );
};

const CabGlance: React.FC<{dur: number}> = ({dur}) => {
  const frame = useCurrentFrame();
  const z = interpolate(frame, [0, Math.max(30, dur)], [11.0, 13.4]);
  const cam = handheld(camKeys(frame, [{f: 0}]), frame, 2, 'cab');
  return (
    <Stage25D cam={cam}>
      <Layer z={1}>
        <CarCorridor
          id="cab13"
          pcam={{x: 0.0, y: -0.05, z, f: 900}}
          light="warm"
          items={corridorItems(EP1_CORRIDOR.filter((c) => c.z > 9), 'warm', frame)}
          endWindow={(r) => (
            <g>
              <rect x={r.x} y={r.y} width={r.w} height={r.h} fill="#3a3a33" />
              <rect x={r.x} y={r.y} width={r.w} height={r.h * 0.4} fill="#4a4a40" />
              <Pavel x={r.x + r.w * 0.55} y={r.y + r.h * 2.1} scale={r.h / 520} view="profile" lod={1} frame={frame} pose={PAVEL_POSES.cab_intercom} />
              <rect x={r.x} y={r.y} width={r.w} height={r.h} fill="#fff" opacity={0.06} />
            </g>
          )}
        />
      </Layer>
      <PencilNumber x={1110} y={330} text="13" at={1} size={84} color="#2a2724" />
    </Stage25D>
  );
};

const Reflection: React.FC = () => {
  const frame = useCurrentFrame();
  return (
    <AbsoluteFill style={{background: '#040505'}}>
      <div style={{position: 'absolute', inset: 0, transform: 'scale(1.6)', transformOrigin: '50% 40%', opacity: 0.8}}>
        <CarOutside frame={frame + 400} motion={1} light="dark" />
      </div>
      <svg width={1920} height={1080} style={{position: 'absolute', left: 0, top: 0, overflow: 'visible', opacity: 0.32, filter: 'blur(1.2px)'}}>
        <Gleb x={820} y={2350} scale={2.0} view="front" lod={2} frame={frame} light="flashlight" pose={{armL: [4, 8], armR: [4, 8]}} />
      </svg>
      <svg width={1920} height={1080} style={{position: 'absolute', left: 0, top: 0}}>
        <path d="M-100,-100 H2020 V1180 H-100 Z M160,170 Q160,140 190,140 H1730 Q1760,140 1760,170 V900 Q1760,930 1730,930 H190 Q160,930 160,900 Z" fill="#0f1110" fillRule="evenodd" />
        <path d="M420,140 L560,140 L300,930 L200,930 Z" fill="#fff" opacity={0.03} />
      </svg>
      <div style={{position: 'absolute', inset: 0}}>
        <PencilNumber x={1230} y={380} text="14" at={1} size={96} />
      </div>
    </AbsoluteFill>
  );
};
