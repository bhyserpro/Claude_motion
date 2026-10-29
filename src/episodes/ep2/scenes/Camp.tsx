import React from 'react';
import {AbsoluteFill, interpolate, useCurrentFrame} from 'remotion';
import {DSvg, Stage25D} from '../../../components/Stage25D';
import {ContractClause, Monologue, Subtitle, Timestamp} from '../../../components/Text';
import {useWordFrame} from '../../../components/Voice';
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

/** Пункт 3.1 — Глеб цитирует договор, пока Корнеев делит воду. */
const CLAUSES_3 = [
  {num: '3.1', text: 'Страхователь обязан принять все разумные и доступные в сложившихся обстоятельствах меры к уменьшению убытков.'},
  {num: '3.2', text: 'Страхователь обязан незамедлительно сообщить Страховщику о наступлении события, имеющего признаки страхового случая.'},
];

/**
 * Третий день. Вагон превратился в лагерь (E2-02). Пункт 3.1 (E2-N01) — камера переходит на Корнеева,
 * на «Корнеев принял меры первым» он поднимается с бутылок: «Воду делю я» (E2-N02).
 */
export const Ep2Camp: React.FC<{dur: number; standalone: boolean}> = ({dur, standalone}) => {
  const frame = useCurrentFrame();
  const become = useWordFrame('E2-02', 'Становятся', 130);
  const clause = useWordFrame('E2-N01', 'Пункт', 320);
  const named = useWordFrame('E2-N01', 'Корнеев', 500);
  const water = useWordFrame('E2-N02', 'Воду', 560);
  const threat = useWordFrame('E2-N02', 'Кто', 640);
  const cam = handheld(
    camKeys(frame, [
      {f: 0, x: 380, dolly: 0.05},
      {f: clause, x: 470, dolly: 0.16},
      {f: named, x: 720, dolly: 0.34, zoom: 1.03},
      {f: dur, x: 800, dolly: 0.42, zoom: 1.05},
    ]),
    frame,
    2.5,
    'camp',
  );
  const flick = 0.72 + Math.sin(frame / 4.3) * 0.04;
  // поднимается с бутылок к «Воду делю я», на «Кто тронет» — дубинка вперёд
  const rise = interpolate(frame, [water - 14, water + 4], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const kPose = rise < 0.5 ? KORNEEV_POSES.guard_water : frame >= threat ? KORNEEV_POSES.shout : KORNEEV_POSES.stand_dominant;
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
              <Korneev x={rise < 0.5 ? 1450 : 1400} y={1060} scale={0.6} view="three_quarter" facing={-1} lod={2} light="emergency" frame={frame} pose={kPose} holdR="baton" />
            </DSvg>
          }
        />
      </Stage25D>
      <ContractClause start={clause - 4} end={clause + 80} section="3. Права и обязанности сторон" clauses={CLAUSES_3} mark="3.1" markAt={clause + 8} x={0.42} rotate={2} />
      <Timestamp text="ДЕНЬ 3 — 07:15" suffix={standalone ? 'за 4 часа до этого' : undefined} start={0} end={dur} suffixEnd={130} />
      <Monologue voice="E2-02" start={40} end={become} lines={['На третий день люди перестают быть пассажирами.']} />
      <Monologue voice="E2-02" start={become} end={clause - 2} lines={['Становятся заявителями.', 'Каждый уверен, что его случай особый.']} />
      <Monologue voice="E2-N01" start={clause} end={named} lines={['Пункт 3.1. Страхователь обязан принять', 'все меры к уменьшению убытков.']} />
      <Monologue voice="E2-N01" start={named} end={water} lines={['Корнеев принял меры первым.']} />
      <Subtitle voice="E2-N02" who="КОРНЕЕВ" text="Воду делю я. По крышке в час. Кто тронет — пожалеет." />
      <Snd src="hit.wav" dur={50} vol={0.7} />
      <Snd src="noise_cut.wav" from={clause - 4} dur={10} vol={0.12} />
      <Snd src="shuffle.wav" from={water - 14} dur={20} vol={0.45} />
      <Snd src="knock.wav" from={threat + 10} dur={20} vol={0.3} />
      <Snd src="tunnel_drone.wav" dur={dur} vol={0.45} loop />
      <Snd src="breath_close.wav" from={200} dur={300} vol={0.1} loop />
    </AbsoluteFill>
  );
};
