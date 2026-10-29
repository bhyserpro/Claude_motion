import React from 'react';
import {AbsoluteFill} from 'remotion';
import {Recap} from '../../common/Shell';
import {At} from '../../common/Offset';
import {Monologue} from '../../../components/Text';
import {PavelFace} from '../../ep2/scenes/Door';
import {Ep2Night} from '../../ep2/scenes/Night';
import {Footprints} from '../../ep2/scenes/Act';

/** РАНЕЕ (патч №1, §4) — голосом из готовых записей: «У него во рту… камни» → «Другие — босые» → вскрик из кабины. */
export const Ep3Recap: React.FC = () => (
  <Recap
    parts={[
      <AbsoluteFill key="a">
        <At at={90}>
          <PavelFace />
        </At>
        <Monologue voice="R3-1" lines={['У него во рту… камни.']} />
      </AbsoluteFill>,
      <AbsoluteFill key="b">
        <Footprints />
        <Monologue voice="R3-2" lines={['Другие — босые.']} />
      </AbsoluteFill>,
      <AbsoluteFill key="c">
        <At at={350}>
          <Ep2Night dur={750} />
        </At>
      </AbsoluteFill>,
    ]}
  />
);
