import React from 'react';
import {AbsoluteFill} from 'remotion';
import {Subtitle} from '../../../components/Text';
import {Recap} from '../../common/Shell';
import {At} from '../../common/Offset';
import {GeigerTrack} from '../../common/audio';
import {Ep4Siege} from '../../ep4/scenes/Siege';
import {Crackle, NinaWhisper} from '../../ep4/scenes/Dose';

/** РАНЕЕ: лица в окнах, «Кроме тебя», треск дозиметра. */
export const Ep5Recap: React.FC = () => (
  <Recap
    parts={[
      <AbsoluteFill key="a">
        <At at={420}>
          <Ep4Siege dur={1500} />
        </At>
      </AbsoluteFill>,
      <AbsoluteFill key="b">
        <At at={85}>
          <NinaWhisper />
        </At>
        <Subtitle who="НИНА" text="Я подделала всех. Кроме тебя." small start={0} end={60} />
      </AbsoluteFill>,
      <AbsoluteFill key="c">
        <At at={620}>
          <Crackle offset={0} />
        </At>
        <GeigerTrack segs={[[0, 200]]} end={60} vol={0.9} />
      </AbsoluteFill>,
    ]}
  />
);
