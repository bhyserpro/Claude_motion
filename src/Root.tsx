import React from 'react';
import {Composition, Folder} from 'remotion';
import {FPS, HEIGHT, WIDTH} from './config';
import {EPISODE_FRAMES, FILM_FRAMES} from './episodes/durations';
import {FullFilm} from './FullFilm';
import {Sandbox} from './Sandbox';
import {CharacterSheet} from './CharacterSheet';
import {Ep1} from './episodes/ep1';
import {Ep2} from './episodes/ep2';
import {Ep3} from './episodes/ep3';
import {Ep4} from './episodes/ep4';
import {Ep5} from './episodes/ep5';

export const RemotionRoot: React.FC = () => (
  <>
    <Folder name="Episodes">
      <Composition id="Ep1" component={Ep1} durationInFrames={EPISODE_FRAMES[0]} fps={FPS} width={WIDTH} height={HEIGHT} defaultProps={{standalone: true}} />
      <Composition id="Ep2" component={Ep2} durationInFrames={EPISODE_FRAMES[1]} fps={FPS} width={WIDTH} height={HEIGHT} defaultProps={{standalone: true}} />
      <Composition id="Ep3" component={Ep3} durationInFrames={EPISODE_FRAMES[2]} fps={FPS} width={WIDTH} height={HEIGHT} defaultProps={{standalone: true}} />
      <Composition id="Ep4" component={Ep4} durationInFrames={EPISODE_FRAMES[3]} fps={FPS} width={WIDTH} height={HEIGHT} defaultProps={{standalone: true}} />
      <Composition id="Ep5" component={Ep5} durationInFrames={EPISODE_FRAMES[4]} fps={FPS} width={WIDTH} height={HEIGHT} defaultProps={{standalone: true}} />
      <Composition id="FullFilm" component={FullFilm} durationInFrames={FILM_FRAMES} fps={FPS} width={WIDTH} height={HEIGHT} />
    </Folder>
    <Folder name="Checks">
      <Composition id="CharacterSheet" component={CharacterSheet} durationInFrames={1} fps={FPS} width={WIDTH} height={HEIGHT} defaultProps={{section: 'all' as const}} />
      <Composition id="Sandbox" component={Sandbox} durationInFrames={300} fps={FPS} width={WIDTH} height={HEIGHT} />
    </Folder>
  </>
);
