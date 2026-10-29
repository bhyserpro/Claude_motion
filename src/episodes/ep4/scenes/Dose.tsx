import React from 'react';
import {AbsoluteFill, interpolate, Sequence, useCurrentFrame} from 'remotion';
import {DSvg, Stage25D} from '../../../components/Stage25D';
import {Subtitle} from '../../../components/Text';
import {Nina} from '../../../components/Characters/Nina';
import {camKeys, handheld} from '../../../lib/camera';
import {geigerLed, GeigerTrack, Snd} from '../../common/audio';
import {AshShot, DosimeterShot, PocketShot} from '../../common/closeups';

const PULL = 150; // карман
const CRACKLE = 260; // дозиметр Павла у пальто — треск
const SEGS: [number, number][] = [
  [CRACKLE, 8],
  [CRACKLE + 90, 40],
  [CRACKLE + 170, 200],
];

/** Значение на ЖК бежит вверх и не останавливается. */
export const runningDose = (f: number) => {
  if (f < 430) return 0.4;
  const t = (f - 430) / 30;
  return 0.4 * Math.pow(1.9, t);
};
const fmt = (v: number) => (v < 10 ? v.toFixed(2) : v < 100 ? v.toFixed(1) : v < 10000 ? v.toFixed(0) : '9999').replace('.', ',');

/** Темнота, шёпот «Я подделала всех. Кроме тебя» (E4-08). Карман. Дозиметр Павла у пальто — сплошной треск, вдох Глеба (E4-09). */
export const Ep4Dose: React.FC<{dur: number}> = ({dur}) => {
  return (
    <AbsoluteFill style={{background: '#000'}}>
      <Sequence durationInFrames={PULL}>
        <NinaWhisper />
      </Sequence>
      <Sequence from={PULL} durationInFrames={CRACKLE - PULL}>
        <Pull />
      </Sequence>
      <Sequence from={CRACKLE} durationInFrames={dur - CRACKLE}>
        <Crackle offset={430} />
      </Sequence>
      <Subtitle voice="E4-08" who="НИНА" text="Я подделала всех. Кроме тебя." small start={20} end={140} />
      <Snd src="breath_close.wav" dur={PULL} vol={0.3} loop />
      <GeigerTrack segs={SEGS} end={dur} vol={1} xfade={6} />
    </AbsoluteFill>
  );
};

export const NinaWhisper: React.FC = () => {
  const frame = useCurrentFrame();
  const soft = frame >= 95 && frame < 125;
  return (
    <Stage25D cam={handheld(camKeys(frame, [{f: 0, zoom: 1}, {f: 300, zoom: 1.06}]), frame, 1, 'nw')} bg="#000">
      <DSvg>
        <rect x={-200} y={-200} width={2400} height={1500} fill="#050101" />
        <Nina x={980} y={2620} scale={2.5} view="three_quarter" facing={-1} lod={2} light="emergency" episode={4} softBrows={soft} fog={0.55} fogColor="#000000" frame={frame} pose={{headYaw: -0.25, armL: [4, 4], armR: [4, 4]}} />
      </DSvg>
    </Stage25D>
  );
};

const Pull: React.FC = () => {
  const frame = useCurrentFrame();
  return <PocketShot light="dark" progress={interpolate(frame, [10, 110], [1, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'})} />;
};

export const Crackle: React.FC<{offset: number}> = ({offset}) => {
  const lf = useCurrentFrame();
  const f = lf + offset;
  const v = runningDose(f);
  return (
    <DosimeterShot
      variant="pavel"
      value={fmt(v)}
      unit="мЗв/ч"
      led={geigerLed(f, SEGS, 99999, 6, 1) || f > 600}
      light="flashlight"
      hand="#B8A996"
      warn={f > 520}
      shake={f > 600 ? 3 : 1}
      bg={<AshShot part="coat" light="dark" />}
    />
  );
};
