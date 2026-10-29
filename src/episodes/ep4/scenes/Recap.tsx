import React from 'react';
import {AbsoluteFill} from 'remotion';
import {Recap} from '../../common/Shell';
import {At} from '../../common/Offset';
import {Subtitle} from '../../../components/Text';
import {Chamber, Frozen} from '../../ep3/scenes/Shaft';
import {Unfold} from '../../ep3/scenes/List';
import {SHAFT} from '../../ep3/timing';

/** РАНЕЕ (патч №1, §4) — голосом из готовых записей: «Не трогай меня!» → «Тсс.» → «Мне жаль.» */
export const Ep4Recap: React.FC = () => (
  <Recap
    parts={[
      <AbsoluteFill key="a">
        <At at={SHAFT.panic + 4 - SHAFT.enterChamber}>
          <Chamber offset={SHAFT.enterChamber} />
        </At>
        <Subtitle voice="R4-1" who="КОРНЕЕВ" text="Не трогай меня!" />
      </AbsoluteFill>,
      <AbsoluteFill key="b">
        <At at={SHAFT.touch + 10 - SHAFT.silence}>
          <Frozen offset={SHAFT.silence} />
        </At>
        <Subtitle voice="R4-2" text="Тсс." italic small />
      </AbsoluteFill>,
      <AbsoluteFill key="c">
        <At at={170}>
          <Unfold />
        </At>
        <Subtitle voice="R4-3" who="НИНА" text="Мне жаль." />
      </AbsoluteFill>,
    ]}
  />
);
