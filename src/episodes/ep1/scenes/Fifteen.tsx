import React from 'react';
import {AbsoluteFill, interpolate, Sequence, useCurrentFrame} from 'remotion';
import {Layer, Stage25D} from '../../../components/Stage25D';
import {FlashlightMask} from '../../../components/FX';
import {PencilNumber, Timestamp} from '../../../components/Text';
import {CarCorridor} from '../../../components/Props/MetroCar';
import {COAT_POSES} from '../../../components/Characters/CoatFigure';
import {POSES} from '../../../components/Characters/Rig';
import {camKeys, handheld, impact} from '../../../lib/camera';
import {makeProjector} from '../../../lib/persp';
import {GeigerTrack, Snd} from '../../common/audio';
import {CorridorActor, corridorItems} from '../../common/sets';
import {FogWindowShot} from '../../common/closeups';

const NIGHT: CorridorActor[] = [
  {id: 'office', side: -1, z: 2.4, pose: POSES.sitSlumped},
  {id: 'olga', side: -1, z: 3.2, pose: POSES.sitSlumped},
  {id: 'nina', side: -1, z: 6.1, extra: {ep: 1}, pose: {hipDrop: 1.42, legL: [88, 88], legR: [84, 86], armL: [20, 70], armR: [16, 75], headPitch: 0.4, sit: true}},
  {id: 'student', side: -1, z: 7.5, pose: POSES.sitSlumped},
  {id: 'oldman', side: -1, z: 9.0, pose: POSES.sitSlumped},
  {id: 'semyon', side: -1, z: 10.2, pose: POSES.sitSlumped},
  {id: 'akhmed', side: 1, z: 2.8, pose: POSES.sitSlumped},
  {id: 'puffer', side: 1, z: 6.5, pose: POSES.sitSlumped},
  {id: 'business', side: 1, z: 8.0, pose: POSES.sitSlumped},
  {id: 'korneev', side: -1, z: 11.9, pose: POSES.sitSlumped},
  {id: 'worker', side: 1, z: 5.0, pose: POSES.sitSlumped},
  {id: 'teen', side: -1, z: 4.5, pose: POSES.sitSlumped},
];
const COAT_Z = 13.4;
const STEP = 420;
const GONE = 520;
const GEIGER: [number, number][] = [
  [300, 2],
  [430, 8],
  [500, 40],
];

/** 2:25–2:50. День 1, 23:10. Счёт при свете телефона: 12, 13, 14… и пятнадцатый. «НЕ СЧИТАЙ». */
export const Ep1Fifteen: React.FC<{dur: number}> = ({dur}) => (
  <AbsoluteFill>
    <Sequence durationInFrames={580}>
      <PhoneCount />
    </Sequence>
    <Sequence from={580} durationInFrames={dur - 580}>
      <DontCount />
    </Sequence>
    <Timestamp text="ДЕНЬ 1 — 23:10" start={0} end={580} />
    <Snd src="tunnel_drone.wav" dur={300} vol={0.45} loop trim={900} fadeOut={30} />
    <Snd src="breath_close.wav" dur={300} vol={0.16} loop fadeOut={30} />
    <GeigerTrack segs={GEIGER} end={580} vol={0.9} />
    <Snd src="shuffle.wav" from={STEP} dur={18} vol={0.5} />
    <Snd src="glass_squeak.wav" from={620} dur={48} vol={0.32} />
    <Snd src="glass_squeak.wav" from={672} dur={48} vol={0.3} trim={8} />
    <Snd src="drip.wav" from={720} dur={14} vol={0.4} />
  </AbsoluteFill>
);

const PhoneCount: React.FC = () => {
  const frame = useCurrentFrame();
  const stepK = interpolate(frame, [STEP, STEP + 14], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const pcam = {x: 0.05, y: 0.05, z: 1.2 + stepK * 0.8, f: 900};
  const pr = makeProjector(pcam);
  let cam = handheld(camKeys(frame, [{f: 0}]), frame, 4, 'phc');
  cam = impact(cam, frame, STEP, 8, 14, 'step');
  // луч телефона ведёт по людям, потом ложится на дальнее сиденье справа
  const targets: [number, number, number, number][] = [
    [0, -1.1, 0.9, 5.0],
    [60, -1.1, 0.9, 7.5],
    [120, 1.1, 0.9, 8.0],
    [185, -1.1, 0.9, 11.9],
    [250, 1.15, 0.75, COAT_Z],
    [999, 1.15, 0.75, COAT_Z],
  ];
  const keyF = targets.map((t) => t[0]);
  const bx = interpolate(frame, keyF, targets.map((t) => t[1]), {extrapolateRight: 'clamp'});
  const by = interpolate(frame, keyF, targets.map((t) => t[2]), {extrapolateRight: 'clamp'});
  const bz = interpolate(frame, keyF, targets.map((t) => t[3]), {extrapolateRight: 'clamp'});
  const [tx, ty] = pr.P(bx, by, bz);
  const blink = frame >= 470 && frame < GONE && Math.floor((frame - 470) / 8) % 2 === 0 ? 0 : 1;
  const r = pr.scaleAt(bz) * 2.1;
  const coatHere = frame < GONE;
  const items = corridorItems(NIGHT, 'flashlight', frame, 0);
  if (coatHere) {
    items.push(...corridorItems([{id: 'coat', side: 1, z: COAT_Z, pose: COAT_POSES.sit_head_down_side, extra: {lod: 1}}], 'flashlight', frame, 0));
  }
  const num = (z: number, x: number) => pr.P(x, -0.15, z);
  const [n12x, n12y] = num(7.5, -1.1);
  const [n13x, n13y] = num(8.0, 1.1);
  const [n14x, n14y] = pr.P(-1.1, -0.62, 11.9);
  const [n15x, n15y] = pr.P(1.15, -0.75, COAT_Z);
  return (
    <Stage25D cam={cam}>
      <Layer z={1}>
        <CarCorridor id="phc" pcam={pcam} light="flashlight" items={items} wetSeat={{side: 1, z: COAT_Z, a: frame >= GONE ? 1 : 0}} fogEnd={22} />
      </Layer>
      <FlashlightMask
        id="phm"
        darkness={0.965}
        beams={[
          {sx: 980, sy: 1150, tx, ty, r, intensity: blink * 0.95, stretch: 1.3},
          {sx: 980, sy: 1150, tx: 980, ty: 820, r: 520, intensity: blink * 0.25, stretch: 1.4},
        ]}
        haze={0.12}
      />
      <div style={{position: 'absolute', inset: 0}}>
        <PencilNumber x={n12x} y={n12y} text="12" at={40} size={64} until={GONE} />
        <PencilNumber x={n13x} y={n13y} text="13" at={100} size={64} until={GONE} />
        <PencilNumber x={n14x} y={n14y} text="14" at={165} size={66} until={GONE} />
        <PencilNumber x={n15x} y={n15y - 20} text="15" at={300} size={88} tremble={4} until={GONE + 30} />
      </div>
    </Stage25D>
  );
};

const DontCount: React.FC = () => {
  const frame = useCurrentFrame();
  const progress = interpolate(frame, [20, 120], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const drip = interpolate(frame, [100, 170], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  return <FogWindowShot progress={progress} drip={drip} beamX={0.45 + Math.sin(frame / 50) * 0.03} />;
};

