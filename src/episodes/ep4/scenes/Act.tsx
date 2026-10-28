import React from 'react';
import {AbsoluteFill, Sequence, useCurrentFrame} from 'remotion';
import {DSvg, Stage25D} from '../../../components/Stage25D';
import {InspectionAct, Subtitle} from '../../../components/Text';
import {Gleb} from '../../../components/Characters/Gleb';
import {Nina, NINA_POSES} from '../../../components/Characters/Nina';
import {Passenger, PASSENGER_POSES} from '../../../components/Characters/Passenger';
import {POSES, walkPose} from '../../../components/Characters/Rig';
import {camKeys, handheld} from '../../../lib/camera';
import {GeigerTrack, Snd} from '../../common/audio';
import {At} from '../../common/Offset';
import {ElbowShot} from '../../common/closeups';
import {CarSideLayers, SIDE_FEET} from '../../common/sets';
import {EP2_CAMP} from '../../ep2/cast';
import {Round} from '../../ep2/scenes/Measure';
import {Ampoules, NotebookClose} from '../../ep3/scenes/Bag';

const ITEMS = [
  {text: ['Прокол на руке Семёна.', 'Пустые ампулы в её сумке.'], at: 165},
  {text: ['Список с галочками.', 'Галочка — после смерти.'], at: 455, underline: true},
  {
    text: [
      'Главное: все сидели в одном вагоне,',
      'дышали одним воздухом. Щелчки у всех',
      'были одинаковые. Нельзя облучиться сильнее,',
      'сидя на соседнем сиденье. Её «дозы» — выдумка.',
    ],
    at: 695,
    speed: 1.05,
  },
];

/** Вагон, все смотрят. Глеб стоит в красном свете. */
const Room: React.FC<{phase: 'case' | 'confront' | 'rush'; frame: number}> = ({phase, frame}) => {
  const rush = phase === 'rush';
  const cam = handheld(camKeys(frame, [{f: 0, x: 120, dolly: 0.25}, {f: 400, x: 160, dolly: 0.34}]), frame, rush ? 6 : 2.2, `rm${phase}`);
  const rk = rush ? Math.min(1, frame / 60) : 0;
  return (
    <Stage25D cam={cam} fogEnd={10}>
      <CarSideLayers
        frame={frame}
        id={`rm${phase}`}
        light="emergency"
        lamp={0.7}
        emergencyLamp={0.75}
        dirt={0.8}
        coatsOnFloor
        actors={EP2_CAMP.filter((a) => !['semyon', 'korneev', 'nina', 'olga', 'akhmed'].includes(a.id)).map((a) => ({...a, ep: 4}))}
        wallOverlay={
          <DSvg>
            <Nina x={485} y={SIDE_FEET} scale={0.41} lod={2} light="emergency" episode={4} frame={frame} pose={phase === 'case' ? POSES.sitFront : NINA_POSES.confront} />
          </DSvg>
        }
        midOverlay={
          <DSvg>
            <Gleb x={1150} y={1030} scale={0.64} view="three_quarter" facing={-1} episode={4} lod={2} light="emergency" frame={frame} pose={rush ? {armL: [20, 10], armR: [70, 10], handR: 'open'} : {armL: [4, 8], armR: [30, 60]}} />
            <Passenger type="akhmed" seed="cast-akhmed" x={1620 - rk * 420} y={1030} scale={0.6} view="three_quarter" facing={-1} lod={2} light="emergency" dirt={0.6} frame={frame} pose={rush ? walkPose((frame / 22) % 1, 0.9, PASSENGER_POSES.stand_angry) : PASSENGER_POSES.stand_angry} face={rush ? {mouth: 'open', brows: 14} : undefined} />
            <Passenger type="olga" seed="cast-olga" x={260 + rk * 160} y={1030} scale={0.58} view="three_quarter" facing={1} lod={2} light="emergency" dirt={0.6} frame={frame} pose={PASSENGER_POSES.stand_angry} face={rush ? {mouth: 'open', brows: 12} : undefined} />
          </DSvg>
        }
      />
    </Stage25D>
  );
};

/** Нина в красном свете стоит неподвижно — средний план. */
const NinaConfront: React.FC = () => {
  const frame = useCurrentFrame();
  return (
    <Stage25D cam={handheld(camKeys(frame, [{f: 0, zoom: 1}, {f: 280, zoom: 1.07}]), frame, 1.2, 'ncf')} bg="#120303">
      <DSvg>
        <rect x={-200} y={-200} width={2400} height={1500} fill="#1a0605" />
        <Nina x={960} y={1900} scale={1.6} view="front" lod={2} light="emergency" episode={4} frame={frame} pose={NINA_POSES.confront} rimDir={-20} rimWidth={0.4} />
      </DSvg>
    </Stage25D>
  );
};

/** 0:40–1:30. Глеб излагает дело: «АКТ ОСМОТРА № 2». Нина не отрицает. Пассажиры двигаются на неё. */
export const Ep4Act: React.FC<{dur: number}> = ({dur}) => {
  const frame = useCurrentFrame();
  return (
    <AbsoluteFill>
      <Sequence durationInFrames={150}>
        <Room phase="case" frame={frame} />
      </Sequence>
      <Sequence from={150} durationInFrames={790}>
        <InspectionAct
          number="2"
          red
          fields={[
            {label: 'Объект:', value: 'вагон 4, смерть Семёна А.', at: 152},
            {label: 'Заявитель:', value: 'Ведерникова Н.', at: 158},
          ]}
          items={ITEMS}
          driftSeed="act2"
        />
      </Sequence>
      <Sequence from={300} durationInFrames={80}>
        <ElbowShot />
      </Sequence>
      <Sequence from={380} durationInFrames={60}>
        <Ampoules />
      </Sequence>
      <Sequence from={600} durationInFrames={80}>
        <NotebookClose fold={1} />
      </Sequence>
      <Sequence from={940} durationInFrames={110}>
        <At at={20}>
          <Round />
        </At>
      </Sequence>
      <Sequence from={1050} durationInFrames={290}>
        <NinaConfront />
      </Sequence>
      <Sequence from={1340} durationInFrames={dur - 1340}>
        <Room phase="rush" frame={frame} />
      </Sequence>
      <Subtitle who="НИНА" text="Воды на пять дней. Нас было тринадцать." start={1065} end={1155} />
      <Subtitle who="НИНА" text="Я выбирала тех, кто умрёт всё равно." start={1160} end={1245} />
      <Subtitle who="НИНА" text="Ошиблась я в одном. Всё равно умрут все." start={1250} end={1338} />
      <Subtitle who="АХМЕД" text="Ты их убивала!" start={1350} end={1405} />
      <Subtitle who="ГЛЕБ" text="Тихо!" start={1440} end={dur} />
      <GeigerTrack segs={[[946, 2]]} end={1050} vol={0.7} />
      <Snd src="tunnel_drone.wav" dur={dur} vol={0.4} loop trim={130} />
      <Snd src="shuffle.wav" from={1340} dur={dur - 1340} vol={0.7} loop />
      <Snd src="cry_short.wav" from={1352} dur={16} vol={0.55} rate={0.8} />
      <Snd src="cry_short.wav" from={1395} dur={16} vol={0.5} rate={1.1} />
      <Snd src="hit.wav" from={1440} dur={30} vol={0.3} />
    </AbsoluteFill>
  );
};
