import React from 'react';
import {AbsoluteFill, interpolate, Sequence, useCurrentFrame} from 'remotion';
import {DSvg, Stage25D} from '../../../components/Stage25D';
import {FlashlightMask} from '../../../components/FX';
import {Monologue} from '../../../components/Text';
import {AmpouleBox, AmpouleLabel} from '../../../components/Props/Ampoule';
import {NinaNotebook} from '../../../components/Props/Notebook';
import {Nina} from '../../../components/Characters/Nina';
import {Gleb, GLEB_POSES} from '../../../components/Characters/Gleb';
import {camKeys, handheld} from '../../../lib/camera';
import {fbm1} from '../../../lib/noise';
import {Snd} from '../../common/audio';
import {useWordFrame} from '../../../components/Voice';
import {CarSideLayers, SIDE_FEET} from '../../common/sets';
import {EP2_CAMP, lie} from '../../ep2/cast';

/** Вагон ночью: Нина спит на скамье, у ног — её сумка. Глеб присел рядом. */
export const NinaAsleep: React.FC<{frame: number; awake?: boolean; glebPose?: 'crouch' | 'stand'; push?: number}> = ({frame, awake = false, glebPose = 'crouch', push = 0}) => {
  const cam = handheld(camKeys(frame, [{f: 0, x: -340, dolly: 0.42 + push}]), frame, 2, 'nas');
  return (
    <Stage25D cam={cam} fogEnd={10}>
      <CarSideLayers
        frame={frame}
        id="nas"
        light="emergency"
        lamp={0.42}
        emergencyLamp={0.42}
        dirt={0.7}
        coatsOnFloor
        actors={EP2_CAMP.filter((a) => a.id !== 'nina' && a.id !== 'semyon' && a.id !== 'office')}
        wallOverlay={
          <DSvg>
            {awake ? (
              <Nina x={485} y={SIDE_FEET} scale={0.41} lod={2} light="emergency" episode={3} frame={frame} pose={{hipDrop: 1.0, thighScale: 0.3, legL: [3, 0], legR: [3, 0], armL: [-8, 115], armR: [-8, 115], sit: true}} holdR="notebook" />
            ) : (
              <Nina x={640} y={640} scale={0.41} lod={2} light="emergency" episode={3} frame={frame} face={{eyes: 'closed'}} pose={{...lie(1), headTilt: fbm1('ns', frame / 30, 2) * 4}} />
            )}
            <rect x={300} y={760} width={140} height={110} rx={20} fill="#2a1e1e" />
          </DSvg>
        }
        midOverlay={
          <DSvg>
            <Gleb x={600} y={1030} scale={0.64} view="three_quarter" facing={-1} episode={3} lod={2} light="emergency" frame={frame} pose={glebPose === 'crouch' ? GLEB_POSES.kneel_inspect : {}} holdR="flashlight" />
          </DSvg>
        }
      />
    </Stage25D>
  );
};

/** Луч скользит по листу. */
const NotebookClose: React.FC<{fold: number; highlight?: number; light?: 'flashlight' | 'emergency'}> = ({fold, highlight = 0, light = 'flashlight'}) => {
  const frame = useCurrentFrame();
  const by = interpolate(frame, [0, 120, 200], [380, 620, 600], {extrapolateRight: 'clamp'});
  return (
    <Stage25D cam={handheld(camKeys(frame, [{f: 0, zoom: 1.0}, {f: 260, zoom: 1.06}]), frame, 2, 'nbc')} bg="#060505">
      <DSvg>
        <rect x={-200} y={-200} width={2400} height={1500} fill="#151312" />
        <NinaNotebook x={960} y={560} scale={1.05} rotate={-4} fold={fold} highlightLast={highlight} light={light} />
      </DSvg>
      <FlashlightMask id="nbm" darkness={0.93} beams={[{sx: 1700, sy: 1200, tx: 900 + fbm1('nbx', frame / 25, 2) * 60, ty: by, r: 360, intensity: 1}]} haze={0.04} />
    </Stage25D>
  );
};
export {NotebookClose};

/** Нина спит. На «Морфин» — ампулы, пустые; на «Список» — блокнот с галочками; потом Нина шевелится (E3-04). */
export const Ep3Bag: React.FC<{dur: number}> = ({dur}) => {
  const frame = useCurrentFrame();
  const amp = useWordFrame('E3-04', 'Морфин', 50) - 6;
  const list = useWordFrame('E3-04', 'Список', 170) - 6;
  const stir = useWordFrame('E3-04', 'галочки', 260) + 26;
  return (
    <AbsoluteFill>
      <Sequence durationInFrames={amp}>
        <NinaAsleep frame={frame} />
      </Sequence>
      <Sequence from={amp} durationInFrames={list - amp}>
        <Ampoules />
      </Sequence>
      <Sequence from={list} durationInFrames={stir - list}>
        <NotebookClose fold={1} />
      </Sequence>
      <Sequence from={stir} durationInFrames={60}>
        <Stirs />
      </Sequence>
      <Sequence from={stir + 60} durationInFrames={dur - stir - 60}>
        <NinaAsleep frame={frame} push={0.1} />
      </Sequence>
      <Monologue voice="E3-04" start={amp} end={list} lines={['Морфин. Из больничного сейфа.', 'Пустые.']} />
      <Monologue voice="E3-04" start={list} end={stir + 30} lines={['Список. Имена… дозы.', 'И галочки.']} />
      <Snd src="tunnel_drone.wav" dur={dur} vol={0.38} loop trim={150} />
      <Snd src="breath_close.wav" dur={dur} vol={0.12} loop />
      <Snd src="noise_cut.wav" from={stir + 10} dur={14} vol={0.25} />
      <Snd src="shuffle.wav" from={amp - 4} dur={16} vol={0.3} />
    </AbsoluteFill>
  );
};

export const Ampoules: React.FC = () => {
  const frame = useCurrentFrame();
  return (
    <Stage25D cam={handheld(camKeys(frame, [{f: 0, zoom: 1.0}, {f: 180, zoom: 1.08}]), frame, 2, 'amp')} bg="#060505">
      <DSvg>
        <rect x={-200} y={-200} width={2400} height={1500} fill="#2a2a26" />
        <path d="M200,1200 Q160,300 960,240 Q1760,300 1720,1200 Z" fill="#3a3d36" />
        <AmpouleBox x={900} y={520} scale={1.5} empty={4} />
        <AmpouleLabel x={1180} y={760} scale={1.0} rotate={-8} />
      </DSvg>
      <FlashlightMask id="ampm" darkness={0.95} beams={[{sx: 1700, sy: 1200, tx: 960 + fbm1('amx', frame / 30, 2) * 80, ty: 600, r: 470, intensity: 1}]} haze={0.04} />
    </Stage25D>
  );
};

const Stirs: React.FC = () => {
  const frame = useCurrentFrame();
  const t = interpolate(frame, [5, 30], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  return (
    <Stage25D cam={handheld(camKeys(frame, [{f: 0}]), frame, 2, 'stir')} bg="#120303">
      <DSvg>
        <rect x={-200} y={-200} width={2400} height={1500} fill="#1a0605" />
        <Nina x={980} y={2560} scale={2.5} view="three_quarter" facing={1} lod={2} light="emergency" episode={3} face={{eyes: 'closed'}} pose={{headTilt: -20 + t * 14, headYaw: -0.2 + t * 0.15, armL: [4, 4], armR: [4, 4]}} breathe={false} />
      </DSvg>
    </Stage25D>
  );
};
