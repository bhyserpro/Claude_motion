import React from 'react';
import {AbsoluteFill, Sequence, useCurrentFrame} from 'remotion';
import {DSvg, Layer, Stage25D} from '../../../components/Stage25D';
import {FlashlightMask} from '../../../components/FX';
import {Monologue, Subtitle, Timestamp} from '../../../components/Text';
import {CabSide, CAB_FLOOR} from '../../../components/Props/Cab';
import {Semyon, SEMYON_POSES} from '../../../components/Characters/Semyon';
import {Nina, NINA_POSES} from '../../../components/Characters/Nina';
import {Gleb, GLEB_POSES} from '../../../components/Characters/Gleb';
import {camKeys, handheld} from '../../../lib/camera';
import {Snd} from '../../common/audio';
import {useWordFrame} from '../../../components/Voice';
import {ElbowShot, EyeShot} from '../../common/closeups';

/** Кабина: Семён лежит, руки кем-то сложены на груди; очки рядом. */
export const CabRoom: React.FC<{frame: number; beam?: boolean; push?: number; nina?: boolean}> = ({frame, beam = true, push = 0, nina = true}) => {
  const cam = handheld(camKeys(frame, [{f: 0, x: 60, dolly: 0.05 + push}]), frame, 2, 'cab3');
  return (
    <Stage25D cam={cam} fogEnd={9}>
      <Layer z={1.5}>
        <CabSide light="emergency" lamp={0.62} id="cab3" />
        <DSvg>
          <Semyon x={1380} y={CAB_FLOOR - 32} scale={0.6} view="front" light="emergency" lod={2} deadFace noGlasses breathe={false} frame={frame} pose={{...SEMYON_POSES.dead_folded, rootRot: -90}} />
          <g transform={`translate(820,${CAB_FLOOR - 8})`} fill="none" stroke="#2a1210" strokeWidth={4}>
            <circle cx={0} cy={0} r={15} />
            <circle cx={38} cy={0} r={15} />
            <line x1={15} y1={0} x2={23} y2={0} />
          </g>
          {nina ? <Nina x={330} y={CAB_FLOOR + 6} scale={0.62} view="three_quarter" facing={1} lod={2} light="emergency" episode={3} gloves frame={frame} pose={NINA_POSES.confront} /> : null}
        </DSvg>
      </Layer>
      <Layer z={1.15}>
        <DSvg>
          <Gleb x={1180} y={1040} scale={0.66} view="three_quarter" facing={-1} episode={3} lod={2} light="emergency" frame={frame} pose={GLEB_POSES.kneel_inspect} holdR="flashlight" />
        </DSvg>
      </Layer>
      {beam ? <FlashlightMask id="cab3m" darkness={0.55} beams={[{sx: 1150, sy: 620, tx: 980, ty: 820, r: 230, intensity: 1}]} haze={0.1} color="#0a0202" /> : null}
    </Stage25D>
  );
};

/**
 * Кабина. Семён мёртв, руки сложены. «Лучевая. Я предупреждала» (E3-02). Глеб осматривает (E3-N01):
 * на «Зрачки» — глаз крупно, на «И прокол» — сгиб локтя; вывод — E3-03.
 */
export const Ep3Cab: React.FC<{dur: number; standalone: boolean}> = ({dur, standalone}) => {
  const frame = useCurrentFrame();
  const eye = useWordFrame('E3-N01', 'Зрачки', 150) - 6;
  const elbow = useWordFrame('E3-N01', 'И', 240) - 4;
  const back = useWordFrame('E3-N01', 'Свежий', 300) + 28;
  const verdict = useWordFrame('E3-03', 'Острая', 330);
  return (
    <AbsoluteFill>
      <Sequence durationInFrames={eye}>
        <CabRoom frame={frame} />
      </Sequence>
      <Sequence from={eye} durationInFrames={elbow - eye}>
        <EyeShot pupil={0.05} skin="#B09C88" iris="#5a5e5a" lidOpen={0.75} />
      </Sequence>
      <Sequence from={elbow} durationInFrames={back - elbow}>
        <ElbowShot />
      </Sequence>
      <Sequence from={back} durationInFrames={dur - back}>
        <CabRoom frame={frame} push={0.25} />
      </Sequence>
      <Monologue voice="E3-N01" start={eye} end={verdict - 2} lines={['Зрачки — с булавочную головку.', 'И прокол на сгибе локтя. Свежий.']} />
      <Snd src="hit.wav" from={eye} dur={20} vol={0.2} />
      <Timestamp text="ДЕНЬ 4 — 06:05" suffix={standalone ? 'за 7 часов до этого' : undefined} start={0} end={dur} suffixEnd={130} />
      <Subtitle voice="E3-02" who="НИНА" text="Лучевая. Я предупреждала." start={70} end={180} />
      <Monologue voice="E3-03" start={verdict - 2} end={dur - 4} lines={['Острая лучевая убивает за дни. Не за ночь.', 'Убыток не сходился с причиной.']} />
      <Snd src="hit.wav" dur={50} vol={0.6} />
      <Snd src="tunnel_drone.wav" dur={dur} vol={0.42} loop trim={50} />
    </AbsoluteFill>
  );
};
