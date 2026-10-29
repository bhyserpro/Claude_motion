import React from 'react';
import {Film, Shot} from '../common/Shell';
import {EpisodeProps} from '../types';
import {VoiceLine} from '../../components/Voice';
import voice from './voice.json';
import {EP1} from './timing';
import {Ep1Hook} from './scenes/Hook';
import {Ep1Ride} from './scenes/Ride';
import {Ep1Count} from './scenes/Count';
import {Ep1Watch} from './scenes/Watch';
import {Ep1Impact} from './scenes/Impact';
import {Ep1Emergency} from './scenes/Emergency';
import {Ep1Dosimeter} from './scenes/Dosimeter';
import {Ep1PavelLeaves} from './scenes/PavelLeaves';
import {Ep1Fifteen} from './scenes/Fifteen';
import {Ep1End} from './scenes/End';

/** Серия 1. «18:47» (у первой серии нет блока «РАНЕЕ»). */
export const Ep1: React.FC<EpisodeProps> = ({standalone}) => (
  <Film voice={voice as VoiceLine[]}>
    <Shot {...EP1.hook} name="Хук">
      <Ep1Hook dur={EP1.hook.dur} />
    </Shot>
    <Shot {...EP1.ride} name="0:07 Вагон">
      <Ep1Ride dur={EP1.ride.dur} />
    </Shot>
    <Shot {...EP1.count} name="0:30 Счёт">
      <Ep1Count dur={EP1.count.dur} />
    </Shot>
    <Shot {...EP1.watch} name="0:55 18:46">
      <Ep1Watch dur={EP1.watch.dur} />
    </Shot>
    <Shot {...EP1.impact} name="1:10 Удар">
      <Ep1Impact dur={EP1.impact.dur} />
    </Shot>
    <Shot {...EP1.emergency} name="1:25 Аварийный свет">
      <Ep1Emergency dur={EP1.emergency.dur} />
    </Shot>
    <Shot {...EP1.dosimeter} name="1:50 Дозиметр">
      <Ep1Dosimeter dur={EP1.dosimeter.dur} />
    </Shot>
    <Shot {...EP1.pavelLeaves} name="2:10 Павел уходит">
      <Ep1PavelLeaves dur={EP1.pavelLeaves.dur} />
    </Shot>
    <Shot {...EP1.fifteen} name="2:25 Пятнадцатый">
      <Ep1Fifteen dur={EP1.fifteen.dur} />
    </Shot>
    <Shot {...EP1.end} name="2:50 Финал">
      <Ep1End dur={EP1.end.dur} standalone={standalone} />
    </Shot>
  </Film>
);
