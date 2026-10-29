import React from 'react';
import {AbsoluteFill, Sequence} from 'remotion';
import {TitleCard} from '../../../components/Text';
import {Snd} from '../../common/audio';

/** Резкий чёрный на 1 с, в нём один стук под полом. Карточка — 3 с (патч №1). */
export const Ep1End: React.FC<{dur: number; standalone: boolean}> = ({dur, standalone}) => (
  <AbsoluteFill style={{background: '#000'}}>
    <Snd src="knock.wav" from={6} dur={36} vol={1} />
    {standalone ? (
      <Sequence from={30} durationInFrames={dur - 30}>
        <TitleCard episode={1} title="18:47" dur={dur - 30} />
      </Sequence>
    ) : null}
  </AbsoluteFill>
);
