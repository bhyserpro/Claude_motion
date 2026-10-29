import React from 'react';
import {AbsoluteFill, interpolate, Sequence, useCurrentFrame} from 'remotion';
import {DSvg, Stage25D} from '../../../components/Stage25D';
import {FlashlightMask} from '../../../components/FX';
import {Subtitle} from '../../../components/Text';
import {Gleb} from '../../../components/Characters/Gleb';
import {Nina} from '../../../components/Characters/Nina';
import {POSES} from '../../../components/Characters/Rig';
import {camKeys, handheld} from '../../../lib/camera';
import {Snd} from '../../common/audio';
import {useVoiceEnd, useWordFrame} from '../../../components/Voice';
import {Actor} from '../../common/cast';
import {CarSideLayers, SIDE_FEET} from '../../common/sets';
import {headCloseY} from '../../common/tunnelShot';

const CROUCH = {hipDrop: 1.3, legL: [70, 120] as [number, number], legR: [60, 110] as [number, number], lean: 14, armL: [30, 60] as [number, number], armR: [26, 64] as [number, number], sit: true};
const HUDDLE: Actor[] = (
  [
    ['olga', 520, 1],
    ['akhmed', 640, 1],
    ['student', 760, 1],
    ['oldman', 1240, -1],
    ['puffer', 1360, -1],
    ['worker', 1480, -1],
    ['teen', 1600, -1],
    ['business', 400, 1],
  ] as [Actor['id'], number, 1 | -1][]
).map(([id, x, f]) => ({id, x, y: SIDE_FEET + 80, scale: 0.42, view: 'three_quarter' as const, facing: f, pose: CROUCH, dirt: 0.8, extra: {wrapped: true}}));

/** Шёпотом — план (E5-04). Ахмед: «А вы?» — «А я посчитаю». Нина: «Я пойду с ними» (E5-05). Глеб смотрит, кивает. */
export const Ep5Plan: React.FC<{dur: number}> = ({dur}) => {
  const look = useVoiceEnd('E5-05', 470) + 4;
  const eyes = look + 60;
  const akhmed = useWordFrame('E5-N02', 'А', 260) - 4;
  const gleb = useWordFrame('E5-N03', 'А', 285);
  const nina = useWordFrame('E5-05', 'Я', 330) - 4;
  return (
    <AbsoluteFill>
      <Sequence durationInFrames={look}>
        <Huddle akhmed={akhmed} gleb={gleb} nina={nina} end={look} />
      </Sequence>
      <Sequence from={look} durationInFrames={eyes - look}>
        <Look />
      </Sequence>
      <Sequence from={eyes} durationInFrames={dur - eyes}>
        <NinaEyes />
      </Sequence>
      <Subtitle voice="E5-04" who="ГЛЕБ" text="Когда загудит — идите к шахте. Вдоль стены." small />
      <Subtitle voice="E5-04" who="ГЛЕБ" text="Не говорите. Не светите. Не считайте." small />
      <Subtitle voice="E5-N02" who="АХМЕД" text="А вы?" small />
      <Subtitle voice="E5-N03" who="ГЛЕБ" text="А я посчитаю." small />
      <Subtitle voice="E5-05" who="НИНА" text="Я пойду с ними. Без того, кто знает про дозу, они не дойдут." small />
      <Snd src="breath_close.wav" dur={dur} vol={0.22} loop />
      <Snd src="tunnel_drone.wav" dur={dur} vol={0.3} loop trim={140} />
    </AbsoluteFill>
  );
};

/** Кружок шёпотом; камера переходит к говорящему: Глеб → Ахмед → Глеб → Нина. */
const Huddle: React.FC<{akhmed: number; gleb: number; nina: number; end: number}> = ({akhmed, gleb, nina, end}) => {
  const frame = useCurrentFrame();
  const cam = handheld(
    camKeys(frame, [
      {f: 0, x: 0, dolly: 0.3},
      {f: Math.max(1, akhmed - 40), x: 30, dolly: 0.4},
      {f: akhmed, x: -260, dolly: 0.52, zoom: 1.04},
      {f: gleb - 6, x: -250, dolly: 0.52, zoom: 1.04},
      {f: gleb + 6, x: 0, dolly: 0.48},
      {f: nina - 6, x: 10, dolly: 0.48},
      {f: nina + 8, x: 200, dolly: 0.56, zoom: 1.05},
      {f: end, x: 220, dolly: 0.62, zoom: 1.07},
    ]),
    frame,
    1.8,
    'hud',
  );
  return (
    <Stage25D cam={cam} fogEnd={10}>
      <CarSideLayers
        frame={frame}
        id="hud"
        light="flashlight"
        lamp={1}
        emergencyLamp={0.1}
        dirt={0.8}
        coatsOnFloor
        poles={false}
        actors={HUDDLE}
        wallOverlay={
          <DSvg>
            <Nina x={1100} y={SIDE_FEET + 80} scale={0.4} view="three_quarter" facing={-1} lod={2} light="flashlight" episode={5} frame={frame} pose={CROUCH} />
            {/* фонарь на полу светит вверх */}
            <rect x={930} y={SIDE_FEET + 95} width={60} height={20} rx={8} fill="#2E2E2C" />
          </DSvg>
        }
        midOverlay={
          <DSvg>
            <Gleb x={940} y={1060} scale={0.6} view="back" episode={5} lod={2} light="flashlight" frame={frame} pose={{...CROUCH, armR: [40, 70]}} />
          </DSvg>
        }
      />
      <FlashlightMask id="hudm" darkness={0.95} beams={[{sx: 960, sy: 880, tx: 960, ty: 620, r: 560, intensity: 0.85, stretch: 1.4}]} haze={0.05} />
    </Stage25D>
  );
};

const Look: React.FC = () => {
  const frame = useCurrentFrame();
  const S = 3.0;
  const nod = interpolate(frame, [22, 36, 52], [0.1, 0.55, 0.1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  return (
    <Stage25D cam={handheld(camKeys(frame, [{f: 0, zoom: 1}, {f: 210, zoom: 1.08}]), frame, 1, 'lk')} bg="#050505">
      <DSvg>
        <rect x={-200} y={-200} width={2400} height={1500} fill="#0e1110" />
        <Gleb x={900} y={headCloseY(182, S, 480)} scale={S} view="three_quarter" facing={1} episode={5} lod={2} light="flashlight" fog={0.35} fogColor="#000000" breathe={false} pose={{armL: [4, 6], armR: [4, 6], headPitch: nod}} />
      </DSvg>
      <FlashlightMask id="lkm" darkness={0.9} beams={[{sx: 960, sy: 1300, tx: 1000, ty: 600, r: 560, intensity: 0.7}]} haze={0.03} />
    </Stage25D>
  );
};

const NinaEyes: React.FC = () => {
  const frame = useCurrentFrame();
  return (
    <Stage25D cam={handheld(camKeys(frame, [{f: 0, zoom: 1}, {f: 120, zoom: 1.05}]), frame, 1, 'ne')} bg="#050505">
      <DSvg>
        <rect x={-200} y={-200} width={2400} height={1500} fill="#0e1110" />
        <Nina x={1000} y={2620} scale={2.5} view="three_quarter" facing={-1} lod={2} light="flashlight" episode={5} fog={0.35} fogColor="#000000" frame={frame} pose={{...POSES.stand, armL: [4, 4], armR: [4, 4]}} />
      </DSvg>
      <FlashlightMask id="nem" darkness={0.9} beams={[{sx: 960, sy: 1300, tx: 980, ty: 560, r: 560, intensity: 0.7}]} haze={0.03} />
    </Stage25D>
  );
};
