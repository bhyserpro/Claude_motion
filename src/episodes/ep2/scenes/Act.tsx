import React from 'react';
import {AbsoluteFill, interpolate, Sequence, useCurrentFrame} from 'remotion';
import {InspectionAct, Monologue} from '../../../components/Text';
import {BlastDoorClose} from '../../../components/Props/BlastDoor';
import {TUN} from '../../../components/Props/Tunnel';
import {fbm1} from '../../../lib/noise';
import {Snd} from '../../common/audio';
import {DosimeterShot, HandsShot, PocketShot} from '../../common/closeups';
import {TunnelShot} from '../../common/tunnelShot';
import {PavelFace} from './Door';
import {DOOR_Z} from '../shared';
import {PASSAGE_Z} from './Walk';
import {ACT1_END, ACT1_POINTS, ACT1_SCRAPE, PAPER_HOLD} from '../act1';
import {useWordFrame} from '../../../components/Voice';

// пункт пишется сразу после «Пункт N» в диктовке E2-06
const ITEM_TEXTS: {text: string | string[]; speed?: number}[] = [
  {text: 'Ожогов нет.'},
  {text: ['Ногти сорваны.', 'Царапал гермозатвор.']},
  {text: ['Царапины на герме — и с этой стороны.']},
  {text: ['Следы в пыли: его ботинки — к герме.', 'Другие — босые — от ВШ-12.', 'Идут к поезду. Обратно — нет.'], speed: 1.25},
  {text: ['Дозиметр машиниста, служебный: 0,4 мЗв.'], speed: 1.3},
];
export const ACT1_ITEMS = ITEM_TEXTS.map((it, i) => ({...it, at: ACT1_POINTS[i] + 16}));

const Paper: React.FC = () => (
  <InspectionAct
    number="1"
    fields={[
      {label: 'Объект:', value: 'машинист Павел, у гермозатвора ГЗ-3', at: 6},
      {label: 'Время:', value: 'день 3, около 11:00', at: 12},
    ]}
    items={ACT1_ITEMS}
    driftSeed="act1"
  />
);

/** Следы в пыли: низкая камера над полотном, луч по полу. */
export const Footprints: React.FC = () => {
  const frame = useCurrentFrame();
  return (
    <TunnelShot
      id="fp"
      pcam={{x: -0.5, y: 0.85, z: PASSAGE_Z - 0.6, f: 900, cy: 230}}
      passageZ={PASSAGE_Z}
      doorZ={DOOR_Z}
      footprints={{boots: 1, bare: 1}}
      beams={[{x: -0.6 + fbm1('fpb', frame / 30, 2) * 0.2, y: TUN.FLOOR, z: PASSAGE_Z + 1.6, r: 1.6, intensity: 1, sx: 1300, sy: 200}]}
      darkness={0.97}
    />
  );
};

/** «АКТ ОСМОТРА № 1» за диктовкой E2-06: бланк на «Пункт N», вставка-доказательство до следующего пункта. */
export const Ep2Act: React.FC<{dur: number}> = ({dur}) => {
  const frame = useCurrentFrame();
  const P = ACT1_POINTS;
  const [s0, s1] = ACT1_SCRAPE;
  const doorShake = frame >= s0 + 8 && frame < s1 + 6 ? fbm1('ds', frame / 1.4, 1) * 4 : 0;
  const ins = (k: number) => ({from: P[k] + PAPER_HOLD, durationInFrames: (k < 4 ? P[k + 1] - 2 : ACT1_END) - P[k] - PAPER_HOLD});
  const conclusion = useWordFrame('E2-07', 'С', ACT1_END + 15);
  return (
    <AbsoluteFill>
      <Paper />
      <Sequence {...ins(0)}>
        <PavelFace beamY={640} />
      </Sequence>
      <Sequence {...ins(1)}>
        <HandsShot zoom={1.3} beamY={700} />
      </Sequence>
      <Sequence {...ins(2)}>
        <AbsoluteFill style={{background: '#000'}}>
          <BlastDoorClose shake={doorShake} />
          <AbsoluteFill style={{background: 'radial-gradient(ellipse 45% 50% at 50% 55%, rgba(0,0,0,0) 0%, rgba(0,0,0,0.7) 60%, rgba(0,0,0,0.97) 100%)'}} />
        </AbsoluteFill>
      </Sequence>
      <Sequence {...ins(3)}>
        <Footprints />
      </Sequence>
      <Sequence {...ins(4)}>
        <DosimeterShot variant="pavel" value="0,40" unit="мЗв" led={false} light="flashlight" hand="#B8A996" />
      </Sequence>
      <Sequence from={ACT1_END} durationInFrames={dur - ACT1_END}>
        <PocketInsert />
      </Sequence>
      <Monologue voice="E2-07" start={conclusion - 2} end={dur} lines={['С такой дозой живут.', 'От неё не умирают с камнями во рту.']} />
      <Snd src="tunnel_drone.wav" dur={dur} vol={0.4} loop trim={20} />
      {/* скрежет за гермой — ровно в паузе «…на герме… и с этой стороны» */}
      <Snd src="scrape.wav" from={s0 + 8} dur={s1 - s0 + 24} vol={0.45} fadeIn={4} fadeOut={8} />
      {P.map((p, i) => (
        <Snd key={i} src="noise_cut.wav" from={p - 2} dur={8} vol={0.08} />
      ))}
    </AbsoluteFill>
  );
};

const PocketInsert: React.FC = () => {
  const frame = useCurrentFrame();
  return <PocketShot progress={interpolate(frame, [5, 70], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'})} />;
};
