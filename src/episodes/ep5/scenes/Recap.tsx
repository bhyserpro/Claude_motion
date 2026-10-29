import React from 'react';
import {AbsoluteFill} from 'remotion';
import {Subtitle} from '../../../components/Text';
import {Recap} from '../../common/Shell';
import {At} from '../../common/Offset';
import {GeigerTrack} from '../../common/audio';
import {Ep4Siege} from '../../ep4/scenes/Siege';
import {Crackle, NinaWhisper} from '../../ep4/scenes/Dose';

/** РАНЕЕ (патч №1, §4) — голосом из готовых записей: «Тихо!» → «Кроме тебя.» → рёв дозиметра. */
export const Ep5Recap: React.FC = () => (
  <Recap
    parts={[
      <AbsoluteFill key="a">
        <At at={300}>
          <Ep4Siege dur={1050} />
        </At>
        <Subtitle voice="R5-1" who="ГЛЕБ" text="Тихо!" />
      </AbsoluteFill>,
      <AbsoluteFill key="b">
        <At at={85}>
          <NinaWhisper />
        </At>
        <Subtitle voice="R5-2" who="НИНА" text="Кроме тебя." small />
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
