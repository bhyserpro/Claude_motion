import React from 'react';
import {AbsoluteFill, interpolate, Sequence, useCurrentFrame} from 'remotion';
import {DSvg, Stage25D} from '../../../components/Stage25D';
import {Monologue, Timestamp} from '../../../components/Text';
import {Dosimeter} from '../../../components/Props/Dosimeter';
import {Gleb} from '../../../components/Characters/Gleb';
import {POSES} from '../../../components/Characters/Rig';
import {camKeys, handheld} from '../../../lib/camera';
import {fbm1} from '../../../lib/noise';
import {Snd} from '../../common/audio';
import {useWordFrame} from '../../../components/Voice';
import {CarSideLayers} from '../../common/sets';
import {EP2_CAMP} from '../../ep2/cast';

/** Два дозиметра рядом на сиденье: Нины (тёмный) и Павла (жёлтый). */
const TwoDosimeters: React.FC<{rate?: number}> = ({rate = 99999}) => {
  const frame = useCurrentFrame();
  // на «Прибор машиниста» Глеб переключает его на мощность дозы — оба показывают 0,30
  const pavelRate = frame >= rate;
  const slide = interpolate(frame, [10, 60], [-500, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  return (
    <Stage25D cam={handheld(camKeys(frame, [{f: 0, zoom: 1}, {f: 450, zoom: 1.08}]), frame, 1.5, 'two')} bg="#0c0303">
      <DSvg>
        <rect x={-200} y={-200} width={2400} height={1500} fill="#2a1416" />
        {Array.from({length: 9}).map((_, i) => (
          <rect key={i} x={-200} y={-100 + i * 150} width={2400} height={8} fill="#1d0d0e" />
        ))}
        <Dosimeter x={700} y={540} scale={1.15} variant="nina" value="0,30" lcdOn light="emergency" rotate={-6} />
        <g transform={`translate(${slide},0)`}>
          <Dosimeter x={1240} y={560} scale={1.15} variant="pavel" value={pavelRate ? '0,30' : '0,40'} unit={pavelRate ? undefined : 'мЗв'} light="emergency" rotate={5} />
        </g>
        <path d={`M${1500 + slide},${700} Q${1700 + slide},${640} ${2100 + slide},${720} L${2100 + slide},${1000} L${1520 + slide},${960} Z`} fill="#3a2a26" opacity={interpolate(frame, [0, 70, 90], [1, 1, 0], {extrapolateRight: 'clamp'})} />
        <ellipse cx={960} cy={540} rx={900} ry={520} fill="#B9C64A" opacity={0.03 + fbm1('tw', frame / 30, 1) * 0.01} />
      </DSvg>
    </Stage25D>
  );
};

const ROOM = 90; // Глеб с дозиметром Павла — 3 с, дальше оба прибора рядом

/** День 5, 09:00. Глеб кладёт рядом дозиметры Нины и Павла (E4-02), сравнивает показания (E4-N01). */
export const Ep4Dosimeters: React.FC<{dur: number; standalone: boolean}> = ({dur, standalone}) => {
  const frame = useCurrentFrame();
  const docs = useWordFrame('E4-02', 'У', 230);
  const hers = useWordFrame('E4-N01', 'Её', 330);
  const his = useWordFrame('E4-N01', 'Прибор', 400);
  const same = useWordFrame('E4-N01', 'Одинаково', 480);
  return (
    <AbsoluteFill>
      <Sequence durationInFrames={ROOM}>
        <Stage25D cam={handheld(camKeys(frame, [{f: 0, x: 380, dolly: 0.32}, {f: ROOM, x: 430, dolly: 0.4}]), frame, 2, 'dsm')} fogEnd={10}>
          <CarSideLayers
            frame={frame}
            id="dsm"
            light="emergency"
            lamp={0.55}
            emergencyLamp={0.55}
            dirt={0.8}
            coatsOnFloor
            actors={EP2_CAMP.filter((a) => a.id !== 'semyon' && a.id !== 'korneev').map((a) => ({...a, pose: a.id === 'nina' ? {...POSES.sitFront, headPitch: 0.5, headTilt: 14} : a.pose, ep: 4}))}
            midOverlay={
              <DSvg>
                <Gleb x={1180} y={1030} scale={0.64} view="three_quarter" facing={-1} episode={4} lod={2} light="emergency" frame={frame} pose={{...POSES.sitSide, armL: [30, 80], armR: [26, 90], headPitch: 0.6}} holdR="dosimeterPavel" />
              </DSvg>
            }
          />
        </Stage25D>
      </Sequence>
      <Sequence from={ROOM} durationInFrames={dur - ROOM}>
        <TwoDosimeters rate={his - ROOM} />
      </Sequence>
      <Timestamp text="ДЕНЬ 5 — 09:00" suffix={standalone ? 'за час до этого' : undefined} start={0} end={dur} suffixEnd={130} />
      <Monologue voice="E4-02" start={ROOM + 8} end={docs} lines={['Когда клиент присылает идеальные документы —', 'они поддельные.']} />
      <Monologue voice="E4-02" start={docs} end={hers - 2} lines={['У Нины были идеальные документы.']} />
      <Monologue voice="E4-N01" start={hers} end={same} lines={['Её прибор — 0,30.', 'Прибор машиниста — 0,30.']} />
      <Monologue voice="E4-N01" start={same} end={dur - 4} lines={['Одинаково. Как и должно быть.']} />
      <Snd src="noise_cut.wav" from={his} dur={8} vol={0.15} />
      <Snd src="hit.wav" dur={50} vol={0.6} />
      <Snd src="tunnel_drone.wav" dur={dur} vol={0.4} loop trim={100} />
    </AbsoluteFill>
  );
};
