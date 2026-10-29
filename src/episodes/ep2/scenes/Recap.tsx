import React from 'react';
import {AbsoluteFill} from 'remotion';
import {Recap} from '../../common/Shell';
import {At} from '../../common/Offset';
import {Monologue, Subtitle} from '../../../components/Text';
import {PhonesShot} from '../../common/closeups';
import {Reflection} from '../../ep1/scenes/Count';
import {PhoneCount} from '../../ep1/scenes/Fifteen';

/** РАНЕЕ (патч №1, §4) — голосом из готовых записей: «Четырнадцать.» → «…оставайтесь на местах…» → «…пятнадцать.» */
export const Ep2Recap: React.FC = () => (
  <Recap
    parts={[
      <AbsoluteFill key="a">
        <At at={20}>
          <Reflection />
        </At>
        <Monologue voice="R2-1" lines={['Четырнадцать.']} />
      </AbsoluteFill>,
      <AbsoluteFill key="b">
        <At at={40}>
          <PhonesShot />
        </At>
        <Subtitle voice="R2-2" text="…оставайтесь на местах…" italic />
      </AbsoluteFill>,
      <AbsoluteFill key="c">
        <At at={290}>
          <PhoneCount />
        </At>
        <Monologue voice="R2-3" lines={['…пятнадцать.']} />
      </AbsoluteFill>,
    ]}
  />
);
