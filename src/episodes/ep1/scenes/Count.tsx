import React from 'react';
import {AbsoluteFill, interpolate, Sequence, useCurrentFrame} from 'remotion';
import {Layer, Stage25D} from '../../../components/Stage25D';
import {Monologue, PencilNumber} from '../../../components/Text';
import {CarCorridor, CarOutside} from '../../../components/Props/MetroCar';
import {Pavel, PAVEL_POSES} from '../../../components/Characters/Pavel';
import {Gleb} from '../../../components/Characters/Gleb';
import {camKeys, CAM0, handheld} from '../../../lib/camera';
import {Snd} from '../../common/audio';
import {CarSideLayers, corridorItems} from '../../common/sets';
import {EP1_CORRIDOR, EP1_COUNT_ORDER, EP1_SIDE} from '../cast';

const PAN_A = -2300;
const PAN_B = 1250;
const PAN_DUR = 480;
const STANDING = new Set(['korneev', 'worker', 'teen']);

/** 0:30–0:55. POV Глеба: счёт пассажиров 1…12, Павел в стекле кабины — 13, своё отражение — 14. */
export const Ep1Count: React.FC<{dur: number}> = ({dur}) => {
  return (
    <AbsoluteFill>
      <Sequence durationInFrames={PAN_DUR}>
        <SidePan />
      </Sequence>
      <Sequence from={PAN_DUR} durationInFrames={120}>
        <CabGlance />
      </Sequence>
      <Sequence from={PAN_DUR + 120} durationInFrames={dur - PAN_DUR - 120}>
        <Reflection />
      </Sequence>
      <Monologue voice="E1-04" start={PAN_DUR + 140} end={dur} lines={['Четырнадцать. Я всегда считаю.', 'Привычка. Потом проще описывать ущерб.']} />
      <Snd src="rails_loop.wav" dur={dur} vol={0.6} loop trim={60} />
      <Snd src="tunnel_drone.wav" dur={dur} vol={0.3} loop trim={200} />
    </AbsoluteFill>
  );
};

const SidePan: React.FC = () => {
  const frame = useCurrentFrame();
  const camX = interpolate(frame, [0, PAN_DUR], [PAN_A, PAN_B]);
  const cam = handheld({...CAM0, x: camX, dolly: 0.12}, frame, 2.5, 'cnt');
  // кадр появления цифры: когда человек проходит правее центра
  const appear = (x: number) => Math.max(8, Math.round(((x - 1150) * (1.6 - 0.12) - PAN_A) / (PAN_B - PAN_A) * PAN_DUR));
  return (
    <Stage25D cam={cam} fogEnd={10}>
      <CarSideLayers
        frame={frame}
        id="cnt"
        light="warm"
        motion={1}
        actors={EP1_SIDE.map((a) => (a.id === 'nina' ? {...a, lod: 2} : a))}
        wallOverlay={
          <>
            {EP1_COUNT_ORDER.map((p, i) => (
              <PencilNumber key={p.id} x={p.x + 10} y={STANDING.has(p.id) ? 300 : 392} text={String(i + 1)} at={appear(p.x)} size={70} />
            ))}
          </>
        }
      />
    </Stage25D>
  );
};

const CabGlance: React.FC = () => {
  const frame = useCurrentFrame();
  const z = interpolate(frame, [0, 120], [11.0, 14.6]);
  const cam = handheld(camKeys(frame, [{f: 0}]), frame, 2, 'cab');
  return (
    <Stage25D cam={cam}>
      <Layer z={1}>
        <CarCorridor
          id="cab13"
          pcam={{x: 0.0, y: -0.05, z, f: 900}}
          light="warm"
          items={corridorItems(EP1_CORRIDOR.filter((c) => c.z > 9), 'warm', frame)}
          endWindow={(r) => (
            <g>
              <rect x={r.x} y={r.y} width={r.w} height={r.h} fill="#3a3a33" />
              <rect x={r.x} y={r.y} width={r.w} height={r.h * 0.4} fill="#4a4a40" />
              <Pavel x={r.x + r.w * 0.55} y={r.y + r.h * 2.1} scale={r.h / 520} view="profile" lod={1} frame={frame} pose={PAVEL_POSES.cab_intercom} />
              <rect x={r.x} y={r.y} width={r.w} height={r.h} fill="#fff" opacity={0.06} />
            </g>
          )}
        />
      </Layer>
      <PencilNumber x={1110} y={330} text="13" at={20} size={84} color="#2a2724" />
    </Stage25D>
  );
};

const Reflection: React.FC = () => {
  const frame = useCurrentFrame();
  return (
    <AbsoluteFill style={{background: '#040505'}}>
      <div style={{position: 'absolute', inset: 0, transform: 'scale(1.6)', transformOrigin: '50% 40%', opacity: 0.8}}>
        <CarOutside frame={frame + 400} motion={1} light="dark" />
      </div>
      <svg width={1920} height={1080} style={{position: 'absolute', left: 0, top: 0, overflow: 'visible', opacity: 0.32, filter: 'blur(1.2px)'}}>
        <Gleb x={820} y={2350} scale={2.0} view="front" lod={2} frame={frame} light="flashlight" pose={{armL: [4, 8], armR: [4, 8]}} />
      </svg>
      <svg width={1920} height={1080} style={{position: 'absolute', left: 0, top: 0}}>
        <path d="M-100,-100 H2020 V1180 H-100 Z M160,170 Q160,140 190,140 H1730 Q1760,140 1760,170 V900 Q1760,930 1730,930 H190 Q160,930 160,900 Z" fill="#0f1110" fillRule="evenodd" />
        <path d="M420,140 L560,140 L300,930 L200,930 Z" fill="#fff" opacity={0.03} />
      </svg>
      <div style={{position: 'absolute', inset: 0}}>
        <PencilNumber x={1230} y={380} text="14" at={18} size={96} />
      </div>
    </AbsoluteFill>
  );
};
