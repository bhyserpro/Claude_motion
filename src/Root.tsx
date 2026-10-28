import React from 'react';
import {Composition, Folder} from 'remotion';
import {EP_FRAMES, FPS, HEIGHT, WIDTH} from './config';
import {Sandbox} from './Sandbox';
import {CharacterSheet} from './CharacterSheet';
import {Ep1} from './episodes/ep1';
import {Ep2} from './episodes/ep2';
import {Ep3} from './episodes/ep3';

export const RemotionRoot: React.FC = () => (
  <>
    <Folder name="Episodes">
      <Composition id="Ep1" component={Ep1} durationInFrames={EP_FRAMES} fps={FPS} width={WIDTH} height={HEIGHT} defaultProps={{standalone: true}} />
      <Composition id="Ep2" component={Ep2} durationInFrames={EP_FRAMES} fps={FPS} width={WIDTH} height={HEIGHT} defaultProps={{standalone: true}} />
      <Composition id="Ep3" component={Ep3} durationInFrames={EP_FRAMES} fps={FPS} width={WIDTH} height={HEIGHT} defaultProps={{standalone: true}} />
    </Folder>
    <Folder name="Checks">
      <Composition id="CharacterSheet" component={CharacterSheet} durationInFrames={1} fps={FPS} width={WIDTH} height={HEIGHT} defaultProps={{section: 'all' as const}} />
      <Composition id="Sandbox" component={Sandbox} durationInFrames={300} fps={FPS} width={WIDTH} height={HEIGHT} />
    </Folder>
  </>
);
