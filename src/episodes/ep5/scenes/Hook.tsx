import React from 'react';
import {AbsoluteFill, interpolate, useCurrentFrame} from 'remotion';
import {HookText} from '../../../components/Text';
import {CAM0, handheld} from '../../../lib/camera';
import {GeigerTrack} from '../../common/audio';
import {HornHand, strobe, Windshield} from '../shared';

/** ХУК серии 5: кабина, строб, рука на рукояти гудка, за стеклом — десятки белых глаз. */
export const Ep5Hook: React.FC<{dur: number}> = ({dur}) => {
  const frame = useCurrentFrame();
  const s = strobe(frame);
  const squeeze = interpolate(frame, [120, 165], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  return (
    <AbsoluteFill>
      <Windshield frame={frame} cam={handheld({...CAM0, zoom: 1.05}, frame, 2.5, 'h5')} crowd={1} approach={0.25 + frame * 0.0006} strobeK={s} handle hand={<HornHand squeeze={squeeze} strobeK={s} />} />
      <HookText lines={['Тебе осталось жить несколько дней.', 'Ты потратишь их, чтобы нажать **одну кнопку**.']} start={3} end={dur - 2} top={0.12} />
      <GeigerTrack segs={[[0, 200]]} end={168} vol={0.7} />
    </AbsoluteFill>
  );
};
