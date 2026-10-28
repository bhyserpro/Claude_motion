import React from 'react';
import {AbsoluteFill, Sequence} from 'remotion';
import {TitleCard} from '../../../components/Text';
import {Snd} from '../../common/audio';

/** 2:50–3:00. Резкий чёрный. Секунда тишины. Один стук под полом. Карточка. */
export const Ep1End: React.FC<{dur: number; standalone: boolean}> = ({dur, standalone}) => (
  <AbsoluteFill style={{background: '#000'}}>
    <Snd src="knock.wav" from={30} dur={36} vol={1} />
    {standalone ? (
      <Sequence from={90} durationInFrames={dur - 90}>
        <TitleCard episode={1} title="18:47" dur={dur - 90} />
      </Sequence>
    ) : null}
  </AbsoluteFill>
);
