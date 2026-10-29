import React from 'react';
import {AbsoluteFill, interpolate, Sequence, useCurrentFrame} from 'remotion';
import {DSvg, Stage25D} from '../../../components/Stage25D';
import {FlashlightMask} from '../../../components/FX';
import {Monologue, Subtitle} from '../../../components/Text';
import {useWordFrame} from '../../../components/Voice';
import {Pavel} from '../../../components/Characters/Pavel';
import {Gleb, GLEB_POSES} from '../../../components/Characters/Gleb';
import {Semyon} from '../../../components/Characters/Semyon';
import {TUN} from '../../../components/Props/Tunnel';
import {camKeys, handheld} from '../../../lib/camera';
import {Snd} from '../../common/audio';
import {placeAt} from '../../common/cast';
import {headCloseY, TunnelShot} from '../../common/tunnelShot';
import {deadPavel, DOOR_Z, PAVEL_X, PAVEL_Z} from '../shared';

/**
 * Гермозатвор. Подход 9 с под дедукцию Глеба (E2-N04): на «Фонарь машиниста ещё горел» луч находит его фонарь,
 * на «Значит» — его самого. Лицо Павла 2,5 с под «Паша… Господи, Паша» (E2-05), затем Глеб на коленях.
 */
export const Ep2Door: React.FC<{dur: number}> = ({dur}) => {
  const lamp = useWordFrame('E2-N04', 'Фонарь', 20);
  const found = useWordFrame('E2-N04', 'Значит', 170);
  const face = useWordFrame('E2-05', 'Паша', 280) - 10;
  const kneel = face + 76;
  return (
    <AbsoluteFill>
      <Sequence durationInFrames={face}>
        <Approach dur={face} lamp={lamp} found={found} />
      </Sequence>
      <Sequence from={face} durationInFrames={kneel - face}>
        <PavelFace />
      </Sequence>
      <Sequence from={kneel} durationInFrames={dur - kneel}>
        <Kneel />
      </Sequence>
      <Monologue voice="E2-N04" start={lamp - 2} end={found} lines={['Фонарь машиниста ещё горел.', 'Батарейки садятся за двое суток.']} />
      <Monologue voice="E2-N04" start={found} end={face} lines={['Значит, он сидит здесь… с первой ночи.']} />
      <Subtitle voice="E2-05" who="СЕМЁН" text="Паша… Господи, Паша." />
      <Snd src="tunnel_drone.wav" dur={dur} vol={0.55} loop trim={90} />
      <Snd src="shuffle.wav" dur={face} vol={(f) => interpolate(f, [0, face], [0.4, 0.15])} loop />
      <Snd src="hit.wav" from={face} dur={30} vol={0.35} />
      <Snd src="breath_close.wav" from={face} dur={dur - face} vol={0.2} loop />
    </AbsoluteFill>
  );
};

const Approach: React.FC<{dur: number; lamp: number; found: number}> = ({dur, lamp, found}) => {
  const frame = useCurrentFrame();
  const camZ = interpolate(frame, [0, dur], [DOOR_Z - 11, DOOR_Z - 4.4]);
  const find = interpolate(frame, [0, lamp, found, dur], [0, 0.15, 1, 1], {extrapolateRight: 'clamp'});
  // сначала луч ищет по путям, потом находит слабое пятно его фонаря и его самого
  const bx = interpolate(find, [0, 1], [0.4, PAVEL_X + 0.2]);
  const by = interpolate(find, [0, 1], [1.2, 0.9]);
  return (
    <TunnelShot
      id="dr"
      pcam={{x: 0.35, y: -0.05, z: camZ, f: 950, cy: 470}}
      cam={handheld(camKeys(frame, [{f: 0}]), frame, 3, 'dr')}
      doorZ={DOOR_Z}
      doorScratches={1}
      items={() => [deadPavel(frame)]}
      beams={[
        {x: bx, y: by, z: PAVEL_Z - 0.2 + (1 - find) * -2, r: 1.0, intensity: 1},
        {x: 0.2, y: 1.0, z: DOOR_Z - 0.3, r: 1.2, intensity: 0.55, sx: 760, sy: 760, color: '#E8D3A0'},
        // его фонарь на полу, тускло
        {x: PAVEL_X + 1.6, y: TUN.FLOOR - 0.1, z: PAVEL_Z + 0.6, r: 0.5, intensity: 0.28, from: [PAVEL_X + 0.75, TUN.FLOOR - 0.06, PAVEL_Z - 0.3]},
      ]}
      darkness={0.98}
    />
  );
};

/** Лицо Павла крупно, в луче: щебень во рту и в ноздрях, глаза открыты. Держать 2 секунды. */
export const PavelFace: React.FC<{beamY?: number}> = ({beamY}) => {
  const frame = useCurrentFrame();
  const S = 3.4;
  const y = headCloseY(178, S, 470);
  const by = beamY ?? interpolate(frame, [0, 60], [760, 520], {extrapolateRight: 'clamp'});
  const cam = handheld(camKeys(frame, [{f: 0, zoom: 1.0}, {f: 150, zoom: 1.05}]), frame, 2, 'pf');
  return (
    <Stage25D cam={cam} bg="#030404">
      <DSvg>
        <rect x={-200} y={-200} width={2400} height={1500} fill="#1d2220" />
        <Pavel x={900} y={y} scale={S} view="three_quarter" facing={1} dead lod={2} light="flashlight" fog={0.32} fogColor="#000000" pose={{headTilt: -14, headYaw: 0.1, armL: [4, 4], armR: [4, 4]}} />
      </DSvg>
      <FlashlightMask id="pfm" darkness={0.975} beams={[{sx: 1500, sy: 1200, tx: 1010, ty: by, r: 330, intensity: 1, stretch: 1.2}]} haze={0.05} />
    </Stage25D>
  );
};

const Kneel: React.FC = () => {
  const frame = useCurrentFrame();
  const pcam = {x: 0.9, y: -0.2, z: PAVEL_Z - 4.2, f: 950, cy: 470};
  return (
    <TunnelShot
      id="kn"
      pcam={pcam}
      cam={handheld(camKeys(frame, [{f: 0}]), frame, 2.5, 'kn')}
      doorZ={DOOR_Z}
      doorScratches={1}
      items={(pr) => [
        deadPavel(frame),
        {
          z: PAVEL_Z - 0.6,
          render: () => {
            const p = placeAt(pr, PAVEL_X + 1.15, TUN.FLOOR, PAVEL_Z - 0.6, 2, 34);
            return <Gleb x={p.x} y={p.y} scale={p.scale} view="three_quarter" facing={-1} episode={2} lod={1} light="flashlight" frame={frame} pose={GLEB_POSES.kneel_inspect} holdR="flashlight" />;
          },
        },
        {
          z: PAVEL_Z - 1.8,
          render: () => {
            const p = placeAt(pr, 1.1, TUN.FLOOR, PAVEL_Z - 1.8, 2, 34);
            return <Semyon x={p.x} y={p.y} scale={p.scale} view="three_quarter" facing={-1} light="flashlight" frame={frame} holdR="flashlightWarm" pose={{armR: [40, 30]}} />;
          },
        },
      ]}
      beams={[
        {x: PAVEL_X + 0.1, y: 0.8, z: PAVEL_Z, r: 0.75, intensity: 1, sx: 980, sy: 640},
        {x: PAVEL_X + 0.5, y: 1.1, z: PAVEL_Z, r: 1.1, intensity: 0.5, sx: 1500, sy: 560, color: '#E8D3A0'},
      ]}
      darkness={0.975}
    />
  );
};
