import React from 'react';
import {AbsoluteFill, Sequence} from 'remotion';
import {TitleCard} from '../../../components/Text';

/** Резкая тишина 1 с, карточка «Серия 4. Доза» 2,5 с (патч №1; тизер E4-N05 не озвучен). */
export const Ep4End: React.FC<{dur: number; standalone: boolean}> = ({dur, standalone}) => (
  <AbsoluteFill style={{background: '#000'}}>
    {standalone ? (
      <Sequence from={30} durationInFrames={dur - 30}>
        <TitleCard episode={4} title="Доза" dur={dur - 30} />
      </Sequence>
    ) : null}
  </AbsoluteFill>
);
