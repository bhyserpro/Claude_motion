import React from 'react';
import {AbsoluteFill, Sequence} from 'remotion';
import {TitleCard} from '../../../components/Text';

/** 2:50–3:00. Резкая тишина. Карточка «Серия 4. Доза». */
export const Ep4End: React.FC<{dur: number; standalone: boolean}> = ({dur, standalone}) => (
  <AbsoluteFill style={{background: '#000'}}>
    {standalone ? (
      <Sequence from={40} durationInFrames={dur - 40}>
        <TitleCard episode={4} title="Доза" dur={dur - 40} />
      </Sequence>
    ) : null}
  </AbsoluteFill>
);
