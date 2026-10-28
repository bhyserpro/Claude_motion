import {NINA_POSES} from '../../components/Characters/Nina';
import {PASSENGER_POSES} from '../../components/Characters/Passenger';
import {KORNEEV_POSES} from '../../components/Characters/Korneev';
import {Actor} from '../common/cast';
import {seat, standSide} from '../common/sets';

/** Рассадка серии 1 (вид сбоку, вагон до катастрофы). */
export const EP1_SIDE: Actor[] = [
  seat('business', 3),
  seat('office', 5),
  seat('olga', 6, {pose: PASSENGER_POSES.sit_clutch_bag}),
  seat('nina', 8, {pose: NINA_POSES.sitFront, ep: 1}),
  seat('student', 9),
  seat('oldman', 10),
  seat('semyon', 11, {pose: {hipDrop: 1.05, thighScale: 0.32, legL: [4, 0], legR: [4, 0], armL: [4, 34], armR: [4, 34], sit: true}}),
  seat('puffer', 12),
  seat('akhmed', 14),
  standSide('korneev', 830, {pose: KORNEEV_POSES.stand_dominant, scale: 0.41}),
  standSide('worker', 1760, {pose: {armL: [4, 6], armR: [12, 140]}}),
  standSide('teen', -160, {pose: {armL: [4, 6], armR: [4, 6]}}),
];

/** Порядок счёта 1..12 в виде сбоку: x центра и высота головы над полом. */
export const EP1_COUNT_ORDER: {id: string; x: number}[] = [
  {id: 'business', x: -475},
  {id: 'teen', x: -160},
  {id: 'office', x: 80},
  {id: 'olga', x: 215},
  {id: 'nina', x: 485},
  {id: 'student', x: 620},
  {id: 'korneev', x: 830},
  {id: 'oldman', x: 1040},
  {id: 'semyon', x: 1175},
  {id: 'puffer', x: 1310},
  {id: 'akhmed', x: 1580},
  {id: 'worker', x: 1760},
];

import {CorridorActor} from '../common/sets';

/** Тот же вагон в перспективе (вдоль прохода). */
export const EP1_CORRIDOR: CorridorActor[] = [
  {id: 'office', side: -1, z: 2.3},
  {id: 'olga', side: -1, z: 3.0},
  {id: 'nina', side: -1, z: 6.1, extra: {ep: 1}},
  {id: 'student', side: -1, z: 7.4},
  {id: 'oldman', side: -1, z: 11.6},
  {id: 'semyon', side: -1, z: 12.6},
  {id: 'akhmed', side: 1, z: 2.7},
  {id: 'puffer', side: 1, z: 6.6},
  {id: 'business', side: 1, z: 8.1},
  {id: 'korneev', side: 1, z: 9.9, stand: 0.45},
  {id: 'worker', side: -1, z: 5.4, stand: -0.5},
  {id: 'teen', side: 1, z: 4.3, stand: 0.62},
];
