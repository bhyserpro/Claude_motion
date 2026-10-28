import React from 'react';
import {AbsoluteFill, Sequence} from 'remotion';
import {TitleCard} from '../../../components/Text';

/** 2:50–3:00. Чёрный. Карточка «Серия 2. Машинист». */
export const Ep2End: React.FC<{dur: number; standalone: boolean}> = ({dur, standalone}) => (
  <AbsoluteFill style={{background: '#000'}}>
    {standalone ? (
      <Sequence from={45} durationInFrames={dur - 45}>
        <TitleCard episode={2} title="Машинист" dur={dur - 45} />
      </Sequence>
    ) : null}
  </AbsoluteFill>
);
