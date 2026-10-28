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

export const ACT1_ITEMS = [
  {text: 'Ожогов нет.', at: 30},
  {text: ['Ногти сорваны.', 'Царапал гермозатвор.'], at: 245},
  {text: ['Царапины на герме — и с этой стороны.'], at: 475},
  {text: ['Следы в пыли: его ботинки — к герме.', 'Другие — босые — от ВШ-12.', 'Идут к поезду. Обратно — нет.'], at: 712, speed: 1.25},
  {text: ['Дозиметр машиниста, служебный: 0,4 мЗв.'], at: 950, speed: 1.3},
];

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
const Footprints: React.FC = () => {
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

/** 1:20–2:00. «АКТ ОСМОТРА № 1» с вставками-доказательствами в луче фонаря. */
export const Ep2Act: React.FC<{dur: number}> = ({dur}) => {
  const frame = useCurrentFrame();
  const doorShake = frame >= 640 && frame < 680 ? fbm1('ds', frame / 1.4, 1) * 4 : 0;
  return (
    <AbsoluteFill>
      <Paper />
      <Sequence from={150} durationInFrames={80}>
        <PavelFace beamY={640} />
      </Sequence>
      <Sequence from={380} durationInFrames={80}>
        <HandsShot zoom={1.3} beamY={700} />
      </Sequence>
      <Sequence from={620} durationInFrames={80}>
        <AbsoluteFill style={{background: '#000'}}>
          <BlastDoorClose shake={doorShake} />
          <AbsoluteFill style={{background: 'radial-gradient(ellipse 45% 50% at 50% 55%, rgba(0,0,0,0) 0%, rgba(0,0,0,0.7) 60%, rgba(0,0,0,0.97) 100%)'}} />
        </AbsoluteFill>
      </Sequence>
      <Sequence from={860} durationInFrames={80}>
        <Footprints />
      </Sequence>
      <Sequence from={1040} durationInFrames={70}>
        <DosimeterShot variant="pavel" value="0,40" unit="мЗв" led={false} light="flashlight" hand="#B8A996" />
      </Sequence>
      <Sequence from={1110} durationInFrames={dur - 1110}>
        <PocketInsert />
      </Sequence>
      <Monologue start={960} end={dur} lines={['С такой дозой живут.', 'От неё не умирают с камнями во рту.']} />
      <Snd src="tunnel_drone.wav" dur={dur} vol={0.4} loop trim={20} />
      <Snd src="scrape.wav" from={575} dur={120} vol={0.42} fadeIn={10} />
    </AbsoluteFill>
  );
};

const PocketInsert: React.FC = () => {
  const frame = useCurrentFrame();
  return <PocketShot progress={interpolate(frame, [5, 70], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'})} />;
};
