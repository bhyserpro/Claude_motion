import React from 'react';
import {AbsoluteFill, interpolate, Sequence, useCurrentFrame} from 'remotion';
import {HookText} from '../../../components/Text';
import {Snd} from '../../common/audio';
import {EyeShot, LongHand} from '../../common/closeups';
import {LIGHT_FN} from '../../../components/Characters/Rig';

/** Отражение в зрачке: точка фонаря и тянущаяся к нему бледная ладонь. */
const Reflection: React.FC<{reach: number}> = ({reach}) => (
  <g transform="scale(0.8)">
    <circle cx={60} cy={-60} r={22} fill="#eef3f4" opacity={0.9} />
    <g transform={`translate(${-250 + reach * 170},${130 - reach * 100}) rotate(-120)`} opacity={0.85}>
      <LongHand c={(c) => c} len={120} skin="#c9c2b4" shade="#8C8E8C" pose="reach" />
    </g>
  </g>
);

/** ХУК серии 3: глаз Глеба в темноте; в отражении к нему тянется ладонь. Пальцы касаются щеки. */
export const Ep3Hook: React.FC<{dur: number}> = ({dur}) => {
  const frame = useCurrentFrame();
  const reach = interpolate(frame, [0, 140], [0, 1], {extrapolateRight: 'clamp'});
  const touch = interpolate(frame, [125, 165], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  return (
    <AbsoluteFill>
      <Sequence durationInFrames={dur}>
        <EyeShot pupil={0.62} ash={0.6} reflection={<Reflection reach={reach} />} />
        {/* пальцы входят в кадр справа и касаются щеки */}
        <svg width={1920} height={1080} style={{position: 'absolute', inset: 0}}>
          <g transform={`translate(${2350 - touch * 1130},${1050 - touch * 360}) rotate(${-140 + touch * 25})`}>
            <LongHand c={LIGHT_FN.flashlight} len={520} skin="#C9C2B4" shade="#8C8E8C" pose="reach" strips />
          </g>
        </svg>
      </Sequence>
      <HookText voice="E3-01" lines={['Ты стоишь в темноте. Тебя трогают за лицо.', 'Если вздохнёшь — **умрёшь**.']} start={3} end={dur - 2} top={0.12} />
      <Snd src="breath_close_left.wav" dur={dur} vol={0.8} loop />
      <Snd src="heartbeat.wav" dur={dur} vol={0.75} loop />
    </AbsoluteFill>
  );
};
