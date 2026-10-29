import React from 'react';
import {AbsoluteFill, interpolate, random, Sequence, useCurrentFrame} from 'remotion';
import {Stage25D} from '../../../components/Stage25D';
import {GlassCracks} from '../../../components/FX';
import {Monologue, Subtitle} from '../../../components/Text';
import {CoatFigure, COAT_POSES} from '../../../components/Characters/CoatFigure';
import {CAB_FLOOR} from '../../../components/Props/Cab';
import {CAM0, handheld, rumble} from '../../../lib/camera';
import {Snd} from '../../common/audio';
import {CarSideLayers} from '../../common/sets';
import {PalmOnGlass, WindowFace, WIN} from '../../ep4/faces';
import {strobe} from '../shared';
import {CabAlone} from './Act';

const PALMS = 150;
const RELEASE = 290; // отпускает гудок
const COAT_IN = 335; // 1,5 с тишины — единственная «драматическая тишина» серии (патч №1)
const FINGER = 370; // палец к губам, «Тсс» (E5-08)
const NOD = 430;

/** Пустой вагон: ладони на всех окнах, стекло трескается (зеркально серии 1). */
const Palms: React.FC = () => {
  const frame = useCurrentFrame();
  const s = strobe(frame, 12, 5);
  const crack = interpolate(frame, [30, 140], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  return (
    <Stage25D cam={rumble(handheld({...CAM0}, frame, 2, 'plm'), frame, 4)} fogEnd={10}>
      <CarSideLayers
        frame={frame}
        id="plm"
        light="emergency"
        lamp={0.3 + s * 0.5}
        emergencyLamp={s}
        dirt={0.9}
        coatsOnFloor
        poles={false}
        actors={[]}
        outside={
          <>
            {WIN.map((w, i) => (
              <WindowFace key={i} w={w} seed={`plm${i}`} appear={0.75} dx={(random(`pd${i}`) - 0.5) * 80} scale={0.55} frame={frame} />
            ))}
          </>
        }
        glass={(w, i) => (
          <g>
            <PalmOnGlass w={w} press={1} side={i % 2 ? 1 : -1} seed={`pp${i}`} />
            {i % 3 !== 1 ? <PalmOnGlass w={{...w, x: w.x - w.w * 0.3}} press={0.8} side={i % 2 ? -1 : 1} seed={`pq${i}`} /> : null}
            <GlassCracks seed={`hc${i}`} cx={w.x + w.w * 0.5} cy={w.y + w.h * 0.45} radius={w.w * 0.75} progress={crack - (i % 4) * 0.08} color="#a06a60" />
          </g>
        )}
      />
    </Stage25D>
  );
};

/** Глеб держит гудок. «Нас было четырнадцать». Отпускает. Тишина. Не считает. Пятнадцатый садится рядом. */
export const Ep5Hold: React.FC<{dur: number}> = ({dur}) => {
  const frame = useCurrentFrame();
  const finger = interpolate(frame, [FINGER, FINGER + 40], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const nod = interpolate(frame, [NOD, NOD + 12, NOD + 26], [0.2, 0.6, 0.2], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  return (
    <AbsoluteFill style={{background: '#000'}}>
      <Sequence durationInFrames={PALMS}>
        <Palms />
      </Sequence>
      <Sequence from={PALMS} durationInFrames={RELEASE - PALMS}>
        <CabAlone frame={frame} pose="horn" strobeK={strobe(frame, 12, 5)} />
      </Sequence>
      <Sequence from={RELEASE} durationInFrames={COAT_IN - RELEASE}>
        <CabAlone frame={frame} pose="sit" />
      </Sequence>
      <Sequence from={COAT_IN} durationInFrames={dur - 30 - COAT_IN}>
        <CabAlone
          frame={frame}
          pose="sit"
          zoom={1.15}
          headPitch={nod}
          extra={
            <g>
              <rect x={760} y={640} width={260} height={60} rx={14} fill="#1d1a19" />
              <CoatFigure x={890} y={CAB_FLOOR} scale={0.6} view="profile" facing={1} headUp fingerToLips={finger} light="emergency" lod={2} pose={{...COAT_POSES.sit_beside, headYaw: 0.2}} puddle />
            </g>
          }
        />
      </Sequence>
      <Monologue voice="E5-07" start={PALMS + 12} end={RELEASE + 10} lines={['Нас было четырнадцать. Я всегда считаю.']} />
      <Subtitle voice="E5-08" text="Тсс." italic small />
      <Snd src="horn.wav" dur={RELEASE} loop trim={40} vol={(f) => (f < PALMS ? 1 : 0.85)} />
      <Snd src="glass_squeak.wav" from={30} dur={48} vol={0.4} />
      <Snd src="boom.wav" from={40} dur={150} vol={0.35} trim={30} />
      <Snd src="drip.wav" from={COAT_IN + 10} dur={14} vol={0.4} />
      <Snd src="drip.wav" from={COAT_IN + 50} dur={14} vol={0.3} />
    </AbsoluteFill>
  );
};
