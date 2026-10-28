import React from 'react';
import {AbsoluteFill} from 'remotion';
import {TitleCard} from '../../../components/Text';

/** 2:55–3:00. «ПЕРЕГОН · Конец» — и в серии, и в полном фильме. */
export const Ep5End: React.FC<{dur: number}> = ({dur}) => (
  <AbsoluteFill style={{background: '#000'}}>
    <TitleCard title="Конец" dur={dur} />
  </AbsoluteFill>
);
