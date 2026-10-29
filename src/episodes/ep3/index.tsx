import React from 'react';
import {ChapterGap, Film, Shot} from '../common/Shell';
import {EpisodeProps} from '../types';
import {VoiceLine} from '../../components/Voice';
import voice from './voice.json';
import {EP3} from './timing';
import {Ep3Hook} from './scenes/Hook';
import {Ep3Recap} from './scenes/Recap';
import {Ep3Cab} from './scenes/Cab';
import {Ep3Bag} from './scenes/Bag';
import {Ep3Korneev} from './scenes/Korneev';
import {Ep3Shaft} from './scenes/Shaft';
import {Ep3List} from './scenes/List';
import {Ep3Face} from './scenes/Face';

/** Серия 3. «Список». */
export const Ep3: React.FC<EpisodeProps> = ({standalone}) => (
  <Film voice={voice as VoiceLine[]}>
    <Shot {...EP3.hook} name="Хук">
      <Ep3Hook dur={EP3.hook.dur} />
    </Shot>
    <Shot {...EP3.recap} name={standalone ? 'РАНЕЕ' : 'Пауза'}>
      {standalone ? <Ep3Recap /> : <ChapterGap dur={EP3.recap.dur} stamp="ДЕНЬ 4 — 06:05" suffix="за 7 часов до этого" />}
    </Shot>
    <Shot {...EP3.cab} name="0:12 Кабина">
      <Ep3Cab dur={EP3.cab.dur} standalone={standalone} />
    </Shot>
    <Shot {...EP3.bag} name="0:40 Сумка">
      <Ep3Bag dur={EP3.bag.dur} />
    </Shot>
    <Shot {...EP3.korneev} name="1:05 Корнеев">
      <Ep3Korneev dur={EP3.korneev.dur} />
    </Shot>
    <Shot {...EP3.shaft} name="1:25 Шахта">
      <Ep3Shaft dur={EP3.shaft.dur} />
    </Shot>
    <Shot {...EP3.list} name="2:20 Список">
      <Ep3List dur={EP3.list.dur} />
    </Shot>
    <Shot {...EP3.face} name="2:45 Лицо">
      <Ep3Face dur={EP3.face.dur} standalone={standalone} />
    </Shot>
  </Film>
);
