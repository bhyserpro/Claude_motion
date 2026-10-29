import React from 'react';
import {Series} from 'remotion';
import {EPISODE_FRAMES} from './episodes/durations';
import {Ep1} from './episodes/ep1';
import {Ep2} from './episodes/ep2';
import {Ep3} from './episodes/ep3';
import {Ep4} from './episodes/ep4';
import {Ep5} from './episodes/ep5';

/**
 * Полный фильм: 5 серий подряд. Хуки остаются началами глав; блоки «РАНЕЕ» и карточки серий
 * заменены паузой-переходом (чёрный кадр + звук), поэтому длительность каждой серии та же, что у отдельной.
 */
export const FullFilm: React.FC = () => (
  <Series>
    {[Ep1, Ep2, Ep3, Ep4, Ep5].map((Ep, i) => (
      <Series.Sequence key={i} durationInFrames={EPISODE_FRAMES[i]} name={`Серия ${i + 1}`}>
        <Ep standalone={false} />
      </Series.Sequence>
    ))}
  </Series>
);
