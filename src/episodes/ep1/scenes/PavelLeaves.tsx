import React from 'react';
import {AbsoluteFill, interpolate, random, useCurrentFrame} from 'remotion';
import {Layer, Stage25D} from '../../../components/Stage25D';
import {FlashlightMask} from '../../../components/FX';
import {Monologue, PencilNumber, Subtitle, Timestamp} from '../../../components/Text';
import {useWordFrame} from '../../../components/Voice';
import {Tunnel, TUN} from '../../../components/Props/Tunnel';
import {Pavel} from '../../../components/Characters/Pavel';
import {walkPose} from '../../../components/Characters/Rig';
import {camKeys, handheld} from '../../../lib/camera';
import {makeProjector} from '../../../lib/persp';
import {Snd} from '../../common/audio';
import {placeAt} from '../../common/cast';

const zAt = (f: number, walkEnd: number) => interpolate(f, [0, walkEnd], [2.2, 21], {extrapolateRight: 'clamp'});

/**
 * Павел уходит в туннель (E1-09), Глеб считает его шаги (E1-N04): на каждое «сто …» — карандашная цифра
 * у точки фонаря, на «нечего» фонарь гаснет.
 */
export const Ep1PavelLeaves: React.FC<{dur: number}> = ({dur}) => {
  const frame = useCurrentFrame();
  const walkEnd = useWordFrame('E1-N04', 'нечего', 380);
  const steps = [0, 1, 2].map((i) => useWordFrame('E1-N04', 'Сто', 230 + i * 40, i));
  const mono1 = useWordFrame('E1-N04', 'Я', 140);
  const mono2 = useWordFrame('E1-N04', 'Потом', 330);
  const z = zAt(frame, walkEnd);
  const pcam = {x: 0.3, y: -0.2, z: -1.2, f: 950};
  const pr = makeProjector(pcam);
  const p = placeAt(pr, 0.45, TUN.FLOOR, z, 2, 34);
  const [hx, hy] = pr.P(0.62, 0.35, z + 0.2);
  const tz = z + 7;
  const [tx, ty] = pr.P(0.25, 0.9, tz);
  // фонарь тускнеет, потом гаснет
  const dying = frame > walkEnd - 12 ? (frame < walkEnd + 6 ? (random(`pv${frame}`) < 0.5 ? 0.15 : 0.6) : 0) : 1;
  const intensity = interpolate(frame, [0, walkEnd - 15], [1, 0.75], {extrapolateRight: 'clamp'}) * dying;
  const stepMarks = steps.map((f, i) => {
    const [x, y] = pr.P(0.62, 0.35, zAt(f, walkEnd) + 0.2);
    // фонарь далеко и почти не смещается — цифры встают лесенкой вверх-вправо, чтобы не слипаться
    return {x: x + 60 + i * 70, y: y - 70 - i * 58, text: String(110 + i), at: f};
  });
  const cam = handheld(camKeys(frame, [{f: 0}]), frame, 1.2, 'pvl');
  return (
    <AbsoluteFill>
      <Stage25D cam={cam}>
        <Layer z={1}>
          <Tunnel
            id="pvl"
            pcam={pcam}
            light="flashlight"
            items={[
              {
                z,
                render: () => (
                  <Pavel x={p.x} y={p.y} scale={p.scale} view="back" light="silhouette" lod={1} frame={frame} pose={walkPose((frame / 34) % 1, 0.8, {armL: [40, 20]})} rimDir={-90} rimOpacity={0.3 * intensity} />
                ),
              },
            ]}
          />
        </Layer>
        <FlashlightMask
          id="pvlm"
          darkness={0.985}
          beams={[
            {sx: hx, sy: hy, tx, ty, r: pr.scaleAt(tz) * 2.6, intensity, stretch: 1.8},
            {sx: hx, sy: hy, tx: hx, ty: hy - pr.scaleAt(z) * 0.3, r: pr.scaleAt(z) * 1.4, intensity: intensity * 0.35, stretch: 1},
          ]}
          haze={0.35}
        />
      </Stage25D>
      <Timestamp text="ДЕНЬ 1 — 19:20" start={0} end={dur} />
      <div style={{position: 'absolute', inset: 0}}>
        {stepMarks.map((m) => (
          <PencilNumber key={m.text} x={m.x} y={m.y} text={m.text} at={m.at} until={walkEnd + 20} size={54} />
        ))}
      </div>
      <Subtitle voice="E1-09" who="ПАВЕЛ" text="Схожу до гермы. Посмотрю. Двери не открывать." start={6} end={124} />
      <Monologue voice="E1-N04" start={mono1 - 2} end={mono2} lines={['Я считал его шаги.', 'Сто десять… сто одиннадцать… сто двенадцать…']} />
      <Monologue voice="E1-N04" start={mono2} end={dur} lines={['Потом считать стало нечего.']} />
      <Snd src="tunnel_drone.wav" dur={dur} vol={0.5} loop trim={600} />
      <Snd src="shuffle.wav" dur={walkEnd} vol={(f) => interpolate(f, [0, walkEnd], [0.35, 0.04])} loop />
      <Snd src="noise_cut.wav" from={walkEnd + 4} dur={12} vol={0.15} />
    </AbsoluteFill>
  );
};
