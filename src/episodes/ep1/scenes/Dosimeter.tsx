import React from 'react';
import {AbsoluteFill, Sequence, useCurrentFrame} from 'remotion';
import {Stage25D} from '../../../components/Stage25D';
import {Monologue, Subtitle} from '../../../components/Text';
import {useWordFrame} from '../../../components/Voice';
import {NINA_POSES} from '../../../components/Characters/Nina';
import {camKeys, handheld} from '../../../lib/camera';
import {geigerLed, GeigerTrack, Snd} from '../../common/audio';
import {CarSideLayers} from '../../common/sets';
import {DosimeterShot} from '../../common/closeups';
import {EP1_SIDE} from '../cast';

const SEGS: [number, number][] = [[28, 0.5]];

const MEDIUM = 75; // план Нины: шорох сумки, на 40-м кадре в руке дозиметр, дальше — ЖК крупно

/** Нина достаёт дозиметр. Редкие щелчки, цифры на ЖК растут; «Это ещё ничего» (E1-07), мысль Глеба (E1-08). */
export const Ep1Dosimeter: React.FC<{dur: number}> = ({dur}) => {
  const thought = useWordFrame('E1-08', 'Она', 140);
  return (
    <AbsoluteFill>
      <Sequence durationInFrames={MEDIUM}>
        <NinaMedium />
      </Sequence>
      <Sequence from={MEDIUM} durationInFrames={dur - MEDIUM}>
        <Lcd offset={MEDIUM} />
      </Sequence>
      <Subtitle voice="E1-07" who="НИНА" text="Это ещё ничего." start={90} end={135} />
      <Snd src="shuffle.wav" from={8} dur={24} vol={0.4} />
      <Monologue voice="E1-08" start={thought - 2} end={dur} lines={['Она сказала это так, как врачи', 'говорят о том, что уже случилось.']} />
      <GeigerTrack segs={SEGS} end={dur} vol={0.85} />
    </AbsoluteFill>
  );
};

const NinaMedium: React.FC = () => {
  const frame = useCurrentFrame();
  const cam = handheld(camKeys(frame, [{f: 0, x: -760, y: -80, dolly: 0.85, zoom: 1.0}, {f: MEDIUM, x: -770, y: -90, dolly: 0.95, zoom: 1.02}]), frame, 2.5, 'nmed');
  const actors = EP1_SIDE.map((a) =>
    a.id === 'nina' ? {...a, lod: 2 as const, pose: NINA_POSES.sitFront, holdR: (frame > 40 ? 'dosimeterNina' : undefined) as 'dosimeterNina' | undefined} : a,
  );
  return (
    <Stage25D cam={cam} fogEnd={10}>
      <CarSideLayers frame={frame} id="nmed" light="emergency" lamp={0.9} emergencyLamp={0.9} actors={actors} poles={false} />
    </Stage25D>
  );
};

const Lcd: React.FC<{offset: number}> = ({offset}) => {
  const frame = useCurrentFrame();
  const f = frame + offset;
  const v = 0.11 + f * 0.0009;
  return <DosimeterShot value={v.toFixed(2).replace('.', ',')} led={geigerLed(f, SEGS, 99999)} light="emergency" />;
};
