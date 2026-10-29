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
import {useEpisodeFrame, useVoiceLine, useWordFrame} from '../../../components/Voice';
import {A2} from '../act2';
import {At} from '../../common/Offset';
import {ElbowShot} from '../../common/closeups';
import {CarSideLayers, SIDE_FEET} from '../../common/sets';
import {EP2_CAMP} from '../../ep2/cast';
import {Round} from '../../ep2/scenes/Measure';
import {Ampoules, NotebookClose} from '../../ep3/scenes/Bag';

/** Крик Ахмеда и плач Ольги: реплики без тайминга символов — окна по длине файлов, две строки при наложении. */
const AkhmedOlga: React.FC = () => {
  const a = useVoiceLine('E4-05');
  const o = useVoiceLine('E4-06');
  const frame = useEpisodeFrame();
  if (!a || !o) return null;
  const on = (l: {startFrame: number; durationFrames: number}) => frame >= l.startFrame && frame < l.startFrame + l.durationFrames + 9;
  const lines = [on(a) ? {who: 'АХМЕД', text: 'Ты их убила?! Ты сама решала, кому жить?!'} : null, on(o) ? {who: 'ОЛЬГА', text: 'Да как ты могла…'} : null].filter(Boolean) as {who: string; text: string}[];
  return (
    <>
      {lines.map((l, i) => (
        <div key={l.who} style={{position: 'absolute', inset: 0, transform: `translateY(${(i - lines.length + 1) * 38}px)`}}>
          <Subtitle who={l.who} text={l.text} small={l.who === 'ОЛЬГА'} />
        </div>
      ))}
    </>
  );
};

const ITEMS = [
  {text: ['Прокол на руке Семёна.', 'Пустые ампулы в её сумке.'], at: A2.paperA + 6},
  {text: ['Список с галочками.', 'Галочка — после смерти.'], at: A2.paperB + 4, underline: true},
  {
    text: [
      'Главное: все сидели в одном вагоне,',
      'дышали одним воздухом. Щелчки у всех',
      'были одинаковые. Нельзя облучиться сильнее,',
      'сидя на соседнем сиденье. Её «дозы» — выдумка.',
    ],
    at: A2.paperC + 2,
    speed: 0.8,
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

/**
 * Глеб излагает дело (E4-03), вставки — за его словами: прокол → ампулы → список → бланк →
 * «Мы сидели в одном вагоне» → Нина мерит всех, щелчки одинаковые → вывод на бланке.
 * Нина не отрицает (E4-04), пассажиры двигаются на неё (E4-05, E4-06), «Тихо!» (E4-07).
 */
export const Ep4Act: React.FC<{dur: number}> = ({dur}) => {
  const frame = useCurrentFrame();
  const rush = useWordFrame('E4-07', 'Тихо', dur - 40) - 75;
  const seg = (a: number, b: number) => ({from: a, durationInFrames: Math.max(1, b - a)});
  return (
    <AbsoluteFill>
      <Sequence {...seg(0, A2.paperA)}>
        <Room phase="case" frame={frame} />
      </Sequence>
      <Sequence {...seg(A2.paperA, A2.end)}>
        <InspectionAct
          number="2"
          red
          fields={[
            {label: 'Объект:', value: 'вагон 4, смерть Семёна А.', at: A2.paperA + 2},
            {label: 'Заявитель:', value: 'Ведерникова Н.', at: A2.paperA + 8},
          ]}
          items={ITEMS.map((it) => ({...it, at: it.at - A2.paperA}))}
          driftSeed="act2"
        />
      </Sequence>
      <Sequence {...seg(A2.elbow, A2.ampoules)}>
        <ElbowShot />
      </Sequence>
      <Sequence {...seg(A2.ampoules, A2.notebook)}>
        <Ampoules />
      </Sequence>
      <Sequence {...seg(A2.notebook, A2.paperB)}>
        <NotebookClose fold={1} />
      </Sequence>
      <Sequence {...seg(A2.room, A2.round)}>
        <Room phase="case" frame={frame} />
      </Sequence>
      <Sequence {...seg(A2.round, A2.paperC)}>
        <At at={20}>
          <Round />
        </At>
      </Sequence>
      <Sequence {...seg(A2.end, rush)}>
        <NinaConfront />
      </Sequence>
      <Sequence {...seg(rush, dur)}>
        <Room phase="rush" frame={frame} />
      </Sequence>
      <Subtitle voice="E4-04" who="НИНА" text="Воды на пять дней. Нас было тринадцать." />
      <Subtitle voice="E4-04" who="НИНА" text="Я выбирала тех, кто умрёт всё равно." />
      <Subtitle voice="E4-04" who="НИНА" text="Ошиблась я в одном. Всё равно умрут все." />
      {/* E4-05 и E4-06 накладываются: две строки, верхняя — тот, кто начал раньше (§5) */}
      <AkhmedOlga />
      <Subtitle voice="E4-07" who="ГЛЕБ" text="Тихо!" />
      <GeigerTrack segs={[[A2.round + 4, 2]]} end={A2.paperC} vol={0.7} />
      <Snd src="tunnel_drone.wav" dur={dur} vol={0.4} loop trim={130} />
      <Snd src="shuffle.wav" from={rush} dur={dur - rush} vol={0.7} loop />
      <Snd src="hit.wav" from={rush + 75} dur={30} vol={0.3} />
    </AbsoluteFill>
  );
};
