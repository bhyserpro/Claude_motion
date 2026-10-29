import React from 'react';
import {ChapterGap, Film, Shot} from '../common/Shell';
import {EpisodeProps} from '../types';
import {VoiceLine} from '../../components/Voice';
import voice from './voice.json';
import {EP4} from './timing';
import {ACT2_PAPER} from './act2';
import {Ep4Hook} from './scenes/Hook';
import {Ep4Recap} from './scenes/Recap';
import {Ep4Dosimeters} from './scenes/Dosimeters';
import {Ep4Act} from './scenes/Act';
import {Ep4Siege} from './scenes/Siege';
import {Ep4Dose} from './scenes/Dose';
import {Ep4End} from './scenes/End';

/** Серия 4. «Доза». */
export const Ep4: React.FC<EpisodeProps> = ({standalone}) => (
  <Film voice={voice as VoiceLine[]} noLetterbox={ACT2_PAPER.map(([a, b]) => [EP4.act.from + a, EP4.act.from + b] as [number, number])}>
    <Shot {...EP4.hook} name="Хук">
      <Ep4Hook dur={EP4.hook.dur} />
    </Shot>
    <Shot {...EP4.recap} name={standalone ? 'РАНЕЕ' : 'Пауза'}>
      {standalone ? <Ep4Recap /> : <ChapterGap dur={EP4.recap.dur} stamp="ДЕНЬ 5 — 09:00" suffix="за час до этого" />}
    </Shot>
    <Shot {...EP4.dosimeters} name="0:12 Два дозиметра">
      <Ep4Dosimeters dur={EP4.dosimeters.dur} standalone={standalone} />
    </Shot>
    <Shot {...EP4.act} name="0:40 Акт № 2">
      <Ep4Act dur={EP4.act.dur} />
    </Shot>
    <Shot {...EP4.siege} name="1:30 Лица в окнах">
      <Ep4Siege dur={EP4.siege.dur} />
    </Shot>
    <Shot {...EP4.dose} name="2:20 Доза">
      <Ep4Dose dur={EP4.dose.dur} />
    </Shot>
    <Shot {...EP4.end} name="2:50 Финал">
      <Ep4End dur={EP4.end.dur} standalone={standalone} />
    </Shot>
  </Film>
);
