import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {DSvg, Stage25D} from '../../../components/Stage25D';
import {Monologue, Timestamp} from '../../../components/Text';
import {Korneev, KORNEEV_POSES} from '../../../components/Characters/Korneev';
import {camKeys, handheld} from '../../../lib/camera';
import {Snd} from '../../common/audio';
import {CarSideLayers} from '../../common/sets';
import {EP2_CAMP} from '../cast';

/** Три пластиковые бутылки воды, на которых сидит Корнеев. */
export const Bottles: React.FC<{x: number; y: number; s: number; light?: 'emergency' | 'flashlight' | 'warm'}> = ({x, y, s, light = 'emergency'}) => {
  const col = light === 'emergency' ? '#5a4a52' : '#7C939B';
  const cap = light === 'emergency' ? '#3a2228' : '#3d5a6a';
  return (
    <g transform={`translate(${x},${y}) scale(${s})`} opacity={0.75}>
      {[
        [-150, -70],
        [10, -70],
        [-70, -175],
      ].map(([bx, by], i) => (
        <g key={i}>
          <rect x={bx} y={by} width={220} height={100} rx={40} fill={col} />
          <rect x={bx + 214} y={by + 32} width={34} height={36} rx={6} fill={cap} />
          <rect x={bx + 20} y={by + 16} width={170} height={14} rx={7} fill="#fff" opacity={0.18} />
        </g>
      ))}
    </g>
  );
};

/** 0:12–0:35. Третий день. Вагон превратился в лагерь. У Корнеева три бутылки воды, он сидит на них. */
export const Ep2Camp: React.FC<{dur: number; standalone: boolean}> = ({dur, standalone}) => {
  const frame = useCurrentFrame();
  const cam = handheld(camKeys(frame, [{f: 0, x: 380, dolly: 0.05}, {f: dur, x: 520, dolly: 0.28}]), frame, 2.5, 'camp');
  const flick = 0.72 + Math.sin(frame / 4.3) * 0.04;
  return (
    <AbsoluteFill>
      <Stage25D cam={cam} fogEnd={10}>
        <CarSideLayers
          frame={frame}
          id="camp"
          light="emergency"
          lamp={flick}
          emergencyLamp={flick}
          actors={EP2_CAMP}
          dirt={0.7}
          coatsOnFloor
          midOverlay={
            <DSvg>
              <Bottles x={1480} y={1010} s={0.9} />
              <Korneev x={1450} y={1060} scale={0.6} view="three_quarter" facing={-1} lod={2} light="emergency" frame={frame} pose={KORNEEV_POSES.guard_water} holdR="baton" />
            </DSvg>
          }
        />
      </Stage25D>
      <Timestamp text="ДЕНЬ 3 — 07:15" suffix={standalone ? 'за 4 часа до этого' : undefined} start={0} end={dur} suffixEnd={130} />
      <Monologue start={60} end={330} lines={['На третий день люди перестают быть пассажирами.']} />
      <Monologue start={350} end={dur - 4} lines={['Становятся заявителями.', 'Каждый уверен, что его случай особый.']} />
      <Snd src="hit.wav" dur={50} vol={0.7} />
      <Snd src="tunnel_drone.wav" dur={dur} vol={0.45} loop />
      <Snd src="breath_close.wav" from={200} dur={300} vol={0.1} loop />
    </AbsoluteFill>
  );
};
