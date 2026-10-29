import React from 'react';
import {ChapterGap, Film, Shot} from '../common/Shell';
import {EpisodeProps} from '../types';
import {VoiceLine} from '../../components/Voice';
import voice from './voice.json';
import {EP2} from './timing';
import {ACT1_PAPER} from './act1';
import {Ep2Hook} from './scenes/Hook';
import {Ep2Recap} from './scenes/Recap';
import {Ep2Camp} from './scenes/Camp';
import {Ep2Walk} from './scenes/Walk';
import {Ep2Door} from './scenes/Door';
import {Ep2Act} from './scenes/Act';
import {Ep2Measure} from './scenes/Measure';
import {Ep2Night} from './scenes/Night';
import {Ep2End} from './scenes/End';

/** Серия 2. «Машинист». */
export const Ep2: React.FC<EpisodeProps> = ({standalone}) => (
  <Film voice={voice as VoiceLine[]} noLetterbox={ACT1_PAPER.map(([a, b]) => [EP2.act.from + a, EP2.act.from + b] as [number, number])}>
    <Shot {...EP2.hook} name="Хук">
      <Ep2Hook dur={EP2.hook.dur} />
    </Shot>
    <Shot {...EP2.recap} name={standalone ? 'РАНЕЕ' : 'Пауза'}>
      {standalone ? <Ep2Recap /> : <ChapterGap dur={EP2.recap.dur} stamp="ДЕНЬ 3 — 07:15" suffix="за 4 часа до этого" />}
    </Shot>
    <Shot {...EP2.camp} name="0:12 Лагерь">
      <Ep2Camp dur={EP2.camp.dur} standalone={standalone} />
    </Shot>
    <Shot {...EP2.walk} name="0:35 Туннель">
      <Ep2Walk dur={EP2.walk.dur} />
    </Shot>
    <Shot {...EP2.door} name="0:55 Гермозатвор">
      <Ep2Door dur={EP2.door.dur} />
    </Shot>
    <Shot {...EP2.act} name="1:20 Акт № 1">
      <Ep2Act dur={EP2.act.dur} />
    </Shot>
    <Shot {...EP2.measure} name="2:00 Замеры">
      <Ep2Measure dur={EP2.measure.dur} />
    </Shot>
    <Shot {...EP2.night} name="2:25 Ночь">
      <Ep2Night dur={EP2.night.dur} />
    </Shot>
    <Shot {...EP2.end} name="2:50 Финал">
      <Ep2End dur={EP2.end.dur} standalone={standalone} />
    </Shot>
  </Film>
);
