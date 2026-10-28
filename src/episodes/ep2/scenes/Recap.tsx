import React from 'react';
import {AbsoluteFill, interpolate, useCurrentFrame} from 'remotion';
import {Recap} from '../../common/Shell';
import {At} from '../../common/Offset';
import {Chaos} from '../../ep1/scenes/Impact';
import {PhoneCount, DontCount} from '../../ep1/scenes/Fifteen';

/** РАНЕЕ: вспышка, мокрое сиденье, «НЕ СЧИТАЙ». */
export const Ep2Recap: React.FC = () => (
  <Recap
    parts={[
      <AbsoluteFill key="a">
        <At at={2}>
          <Chaos />
        </At>
        <Flash />
      </AbsoluteFill>,
      <AbsoluteFill key="b">
        <At at={530}>
          <PhoneCount />
        </At>
      </AbsoluteFill>,
      <AbsoluteFill key="c">
        <At at={150}>
          <DontCount />
        </At>
      </AbsoluteFill>,
    ]}
  />
);

const Flash: React.FC = () => {
  const frame = useCurrentFrame();
  const a = interpolate(frame, [0, 6, 14], [1, 1, 0], {extrapolateRight: 'clamp'});
  return <AbsoluteFill style={{background: '#F4F2EC', opacity: a}} />;
};
