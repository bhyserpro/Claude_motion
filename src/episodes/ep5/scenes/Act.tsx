import React from 'react';
import {AbsoluteFill, interpolate, Sequence, useCurrentFrame} from 'remotion';
import {DSvg, Layer, Stage25D} from '../../../components/Stage25D';
import {InspectionAct, Monologue} from '../../../components/Text';
import {CabSide, CAB_FLOOR} from '../../../components/Props/Cab';
import {Gleb, GLEB_POSES} from '../../../components/Characters/Gleb';
import {POSES} from '../../../components/Characters/Rig';
import {camKeys, handheld} from '../../../lib/camera';
import {Snd} from '../../common/audio';
import {A3, ACT3_PAPER} from '../act3';
import {useWordFrame} from '../../../components/Voice';

/** Кабина сбоку: Глеб в кресле машиниста. */
export const CabAlone: React.FC<{frame: number; pose?: 'write' | 'sit' | 'horn'; strobeK?: number; extra?: React.ReactNode; zoom?: number; headPitch?: number}> = ({frame, pose = 'sit', strobeK = 0, extra, zoom = 1, headPitch}) => {
  const p =
    pose === 'write'
      ? {...POSES.sitSide, ...GLEB_POSES.write, hipDrop: 1.5, legL: [86, 86] as [number, number], legR: [80, 84] as [number, number], sit: true}
      : pose === 'horn'
        ? {...POSES.sitSide, armL: [72, 18] as [number, number], handL: 'fist' as const, lean: 4}
        : {...POSES.sitSide, armL: [20, 50] as [number, number], armR: [14, 55] as [number, number], headPitch: headPitch ?? 0.2};
  return (
    <Stage25D cam={handheld(camKeys(frame, [{f: 0, x: 220, dolly: 0.25, zoom}]), frame, strobeK > 0 ? 4 : 1.5, 'cab5')} fogEnd={9}>
      <Layer z={1.5}>
        <CabSide light="emergency" lamp={0.45 + strobeK * 0.4} strobe={strobeK} id="cab5" />
        <DSvg>
          <Gleb x={1235} y={CAB_FLOOR} scale={0.62} view="profile" facing={1} episode={5} lod={2} light="emergency" frame={frame} pose={p} holdR={pose === 'write' ? 'pencil' : undefined} holdL={pose === 'write' ? 'notebook' : undefined} />
          {extra}
        </DSvg>
      </Layer>
    </Stage25D>
  );
};

/**
 * Кабина, Глеб один. «АКТ ОСМОТРА № 3» под диктовку E5-06 — поля заполняются на словах.
 * Потом считает шаги уходящих (E5-N04): «Сорок шагов до поворота. Тридцать… двадцать… десять… Всё. Ушли.»
 */
export const Ep5Act: React.FC<{dur: number}> = ({dur}) => {
  const frame = useCurrentFrame();
  const [a, b] = ACT3_PAPER;
  const count = useWordFrame('E5-N04', 'Тридцать', b + 80);
  const gone = useWordFrame('E5-N04', 'Всё', b + 160);
  return (
    <AbsoluteFill>
      <Sequence durationInFrames={a}>
        <CabAlone frame={frame} pose="write" />
      </Sequence>
      <Sequence from={a} durationInFrames={b - a}>
        <InspectionAct
          number="3"
          red
          fields={[
            {label: 'Объект:', value: 'вагон 4, перегон Заводская — Площадь Труда', at: A3.object - a},
            {label: 'Причина убытка:', value: '—', at: A3.reason - a + 20},
            {label: 'Ущерб:', value: 'полный.', at: A3.damage - a + 4},
          ]}
          items={[]}
          driftSeed="act3"
        />
      </Sequence>
      <Sequence from={b} durationInFrames={dur - b}>
        <CabAlone frame={frame} pose="sit" />
      </Sequence>
      <Monologue voice="E5-N04" start={b + 4} end={gone} lines={['Сорок шагов до поворота.', 'Тридцать… двадцать… десять…']} />
      <Monologue voice="E5-N04" start={gone} end={dur} lines={['Всё. Ушли.']} />
      {/* шаги уходящих стихают под счёт и обрываются на «Всё» */}
      <Snd src="shuffle.wav" dur={gone} vol={(f) => interpolate(f, [0, count, gone - 10, gone], [0.35, 0.3, 0.06, 0], {extrapolateRight: 'clamp'})} loop />
      <Snd src="drip.wav" from={gone + 20} dur={14} vol={0.3} />
      <Snd src="tunnel_drone.wav" dur={dur} vol={0.32} loop trim={20} />
    </AbsoluteFill>
  );
};
