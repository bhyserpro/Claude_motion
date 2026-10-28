import React from 'react';
import {AbsoluteFill} from 'remotion';
import {Recap} from '../../common/Shell';
import {At} from '../../common/Offset';
import {Chamber, Frozen} from '../../ep3/scenes/Shaft';
import {Unfold} from '../../ep3/scenes/List';
import {SHAFT} from '../../ep3/timing';

/** РАНЕЕ: синхронный поворот голов, ладонь на лице, строка «Сомов Г. — 6,2 Зв». */
export const Ep4Recap: React.FC = () => (
  <Recap
    parts={[
      <AbsoluteFill key="a">
        <At at={SHAFT.turn - 30 - SHAFT.enterChamber}>
          <Chamber offset={SHAFT.enterChamber} />
        </At>
      </AbsoluteFill>,
      <AbsoluteFill key="b">
        <At at={SHAFT.touch + 10 - SHAFT.silence}>
          <Frozen offset={SHAFT.silence} />
        </At>
      </AbsoluteFill>,
      <AbsoluteFill key="c">
        <At at={325}>
          <Unfold />
        </At>
      </AbsoluteFill>,
    ]}
  />
);
