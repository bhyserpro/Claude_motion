import React from 'react';
import {AbsoluteFill, Sequence} from 'remotion';
import {TitleCard} from '../../../components/Text';
import {Snd} from '../../common/audio';

/** Чёрный 1 с с одним стуком, карточка «Серия 2. Машинист» 2,5 с (патч №1; тизер E2-N07 не озвучен). */
export const Ep2End: React.FC<{dur: number; standalone: boolean}> = ({dur, standalone}) => (
  <AbsoluteFill style={{background: '#000'}}>
    <Snd src="knock.wav" from={8} dur={30} vol={0.8} />
    {standalone ? (
      <Sequence from={30} durationInFrames={dur - 30}>
        <TitleCard episode={2} title="Машинист" dur={dur - 30} />
      </Sequence>
    ) : null}
  </AbsoluteFill>
);
