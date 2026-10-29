import React from 'react';
import {ChapterGap, Film, Shot} from '../common/Shell';
import {EpisodeProps} from '../types';
import {VoiceLine} from '../../components/Voice';
import voice from './voice.json';
import {EP5} from './timing';
import {ACT3_PAPER} from './act3';
import {Ep5Hook} from './scenes/Hook';
import {Ep5Recap} from './scenes/Recap';
import {Ep5Reason} from './scenes/Reason';
import {Ep5Plan} from './scenes/Plan';
import {Ep5Act} from './scenes/Act';
import {Ep5Horn} from './scenes/Horn';
import {Ep5Hold} from './scenes/Hold';
import {Ep5Surface} from './scenes/Surface';
import {Ep5End} from './scenes/End';

/** Серия 5. «Акт осмотра». */
export const Ep5: React.FC<EpisodeProps> = ({standalone}) => (
  <Film voice={voice as VoiceLine[]} noLetterbox={[[EP5.act.from + ACT3_PAPER[0], EP5.act.from + ACT3_PAPER[1]]]}>
    <Shot {...EP5.hook} name="Хук">
      <Ep5Hook dur={EP5.hook.dur} />
    </Shot>
    <Shot {...EP5.recap} name={standalone ? 'РАНЕЕ' : 'Пауза'}>
      {standalone ? <Ep5Recap /> : <ChapterGap dur={EP5.recap.dur} stamp="ДЕНЬ 6 — 04:00" suffix="за 2 часа до этого" />}
    </Shot>
    <Shot {...EP5.reason} name="0:12 Капля крови">
      <Ep5Reason dur={EP5.reason.dur} standalone={standalone} />
    </Shot>
    <Shot {...EP5.plan} name="0:40 План">
      <Ep5Plan dur={EP5.plan.dur} />
    </Shot>
    <Shot {...EP5.act} name="1:10 Акт № 3">
      <Ep5Act dur={EP5.act.dur} />
    </Shot>
    <Shot {...EP5.horn} name="1:40 Гудок">
      <Ep5Horn dur={EP5.horn.dur} />
    </Shot>
    <Shot {...EP5.hold} name="2:15 Не считает">
      <Ep5Hold dur={EP5.hold.dur} />
    </Shot>
    <Shot {...EP5.surface} name="2:40 Поверхность">
      <Ep5Surface dur={EP5.surface.dur} />
    </Shot>
    <Shot {...EP5.end} name="2:55 Конец">
      <Ep5End dur={EP5.end.dur} />
    </Shot>
  </Film>
);
