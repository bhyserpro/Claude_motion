import React from 'react';
import {AbsoluteFill} from 'remotion';
import {Recap} from '../../common/Shell';
import {At} from '../../common/Offset';
import {PavelFace} from '../../ep2/scenes/Door';
import {Ep2Night} from '../../ep2/scenes/Night';
import {Footprints} from '../../ep2/scenes/Act';

/** РАНЕЕ: щебень во рту Павла, босые следы, вскрик из кабины. */
export const Ep3Recap: React.FC = () => (
  <Recap
    parts={[
      <AbsoluteFill key="a">
        <At at={90}>
          <PavelFace />
        </At>
      </AbsoluteFill>,
      <AbsoluteFill key="b">
        <Footprints />
      </AbsoluteFill>,
      <AbsoluteFill key="c">
        <At at={350}>
          <Ep2Night dur={750} />
        </At>
      </AbsoluteFill>,
    ]}
  />
);
