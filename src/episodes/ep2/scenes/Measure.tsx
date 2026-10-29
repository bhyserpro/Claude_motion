import React from 'react';
import {AbsoluteFill, interpolate, Sequence, useCurrentFrame} from 'remotion';
import {DSvg, Stage25D} from '../../../components/Stage25D';
import {Monologue, Subtitle} from '../../../components/Text';
import {Nina, NINA_POSES} from '../../../components/Characters/Nina';
import {Gleb} from '../../../components/Characters/Gleb';
import {walkPose} from '../../../components/Characters/Rig';
import {camKeys, handheld} from '../../../lib/camera';
import {GeigerTrack, Snd} from '../../common/audio';
import {CarSideLayers, SIDE_FEET} from '../../common/sets';
import {Actor} from '../../common/cast';
import {EP2_CAMP} from '../cast';

// Нина мерит всех по очереди. Щелчки у всех одинаковые — 2 в секунду (улика!).
const STOPS: [number, number][] = [
  [0, 365],
  [90, 365],
  [110, 770],
  [190, 770],
  [210, 1190],
  [280, 1190],
  [300, 1330],
  [520, 1330],
];
const GEIGER: [number, number][] = [[6, 2]];

export const Ep2Measure: React.FC<{dur: number}> = ({dur}) => (
  <AbsoluteFill>
    <Sequence durationInFrames={520}>
      <Round />
    </Sequence>
    <Sequence from={520} durationInFrames={dur - 520}>
      <GlebMeasured />
    </Sequence>
    <Subtitle voice="E2-08" who="НИНА" text="У вас много. Вам нужно отдельно." start={310} end={405} />
    <Subtitle voice="E2-09" who="НИНА" text="Нормально." start={640} end={705} />
    <Monologue voice="E2-10" start={670} end={dur} lines={['Она мерила всех. Себя — нет.']} />
    <GeigerTrack segs={GEIGER} end={650} vol={0.75} />
    <Snd src="tunnel_drone.wav" dur={dur} vol={0.4} loop trim={70} />
  </AbsoluteFill>
);

export const Round: React.FC = () => {
  const frame = useCurrentFrame();
  const nx = interpolate(frame, STOPS.map((s) => s[0]), STOPS.map((s) => s[1]), {extrapolateRight: 'clamp'});
  const moving = STOPS.some(([f], i) => i > 0 && frame > STOPS[i - 1][0] && frame < f && STOPS[i - 1][1] !== STOPS[i][1]);
  const semyonLeaves = frame >= 420;
  const sx = interpolate(frame, [420, 520], [1175, 720], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const cam = handheld(camKeys(frame, [{f: 0, x: -520, dolly: 0.35}, {f: 300, x: 380, dolly: 0.4}, {f: 520, x: 260, dolly: 0.42}]), frame, 2.5, 'msr');
  const actors: Actor[] = EP2_CAMP.filter((a) => a.id !== 'nina' && (a.id !== 'semyon' || !semyonLeaves));
  if (semyonLeaves) {
    actors.push({id: 'semyon', x: sx, y: SIDE_FEET + 10, scale: 0.41, view: 'profile', facing: -1, pose: walkPose((frame / 40) % 1, 0.5)});
  }
  return (
    <Stage25D cam={cam} fogEnd={10}>
      <CarSideLayers
        frame={frame}
        id="msr"
        light="emergency"
        lamp={0.72}
        emergencyLamp={0.72}
        actors={actors}
        dirt={0.7}
        coatsOnFloor
        wallOverlay={
          <DSvg>
            <Nina
              x={nx}
              y={SIDE_FEET + 12}
              scale={0.41}
              view="profile"
              facing={-1}
              lod={1}
              light="emergency"
              episode={2}
              frame={frame}
              pose={moving ? walkPose((frame / 30) % 1, 0.5, {armR: [70, 10]}) : NINA_POSES.measure}
              holdR="dosimeterNina"
            />
          </DSvg>
        }
      />
    </Stage25D>
  );
};

/** Глеба мерит последним — и задерживает взгляд на экране на секунду дольше. */
const GlebMeasured: React.FC = () => {
  const frame = useCurrentFrame();
  const close = frame >= 50 && frame < 115;
  const cam = handheld(camKeys(frame, [{f: 0, x: 40, dolly: 0.1}]), frame, 2, 'gm');
  if (close) {
    return (
      <Stage25D cam={handheld(camKeys(frame, [{f: 50, zoom: 1}, {f: 115, zoom: 1.05}]), frame, 1.5, 'gmc')} bg="#120303">
        <DSvg>
          <rect x={-200} y={-200} width={2400} height={1500} fill="#1a0605" />
          <Nina x={1000} y={2650} scale={2.6} view="three_quarter" facing={-1} lod={2} light="emergency" episode={2} frame={frame} pose={{headPitch: 0.7, armL: [4, 4], armR: [4, 4]}} />
          <ellipse cx={980} cy={720} rx={260} ry={130} fill="#B9C64A" opacity={0.08} />
        </DSvg>
      </Stage25D>
    );
  }
  return (
    <Stage25D cam={cam} fogEnd={10}>
      <CarSideLayers
        frame={frame}
        id="gm"
        light="emergency"
        lamp={0.72}
        emergencyLamp={0.72}
        actors={EP2_CAMP.filter((a) => a.id !== 'nina' && a.id !== 'semyon')}
        dirt={0.7}
        coatsOnFloor
        midOverlay={
          <DSvg>
            <Gleb x={760} y={1010} scale={0.64} view="three_quarter" facing={1} lod={2} light="emergency" episode={2} frame={frame} pose={{armL: [4, 8], armR: [4, 10]}} />
            <Nina x={1180} y={1000} scale={0.58} view="three_quarter" facing={-1} lod={2} light="emergency" episode={2} frame={frame} pose={NINA_POSES.measure} holdR="dosimeterNina" />
          </DSvg>
        }
      />
    </Stage25D>
  );
};
