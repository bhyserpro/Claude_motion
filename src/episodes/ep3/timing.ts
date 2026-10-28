import {EP_FRAMES} from '../../config';
import {assertTiling, sceneMap, scenesFromTimecodes} from '../../lib/timing';

// Серия 3. «Список»
export const EP3_SCENES = scenesFromTimecodes([
  ['hook', '0:00', '0:06'],
  ['recap', '0:06', '0:12'],
  ['cab', '0:12', '0:40'],
  ['bag', '0:40', '1:05'],
  ['korneev', '1:05', '1:25'],
  ['shaft', '1:25', '2:20'],
  ['list', '2:20', '2:45'],
  ['face', '2:45', '3:00'],
]);
assertTiling(EP3_SCENES, EP_FRAMES, 'Ep3');
export const EP3 = sceneMap(EP3_SCENES);

// Главная сцена в шахте (кадры относительно её начала)
export const SHAFT = {
  enterChamber: 300,
  findThem: 600,
  god: 790,
  turn: 840, // синхронный поворот голов за 12 кадров
  finger: 880, // палец к губам за 40 кадров
  panic: 960,
  silence: 1130,
  touch: 1240,
  touchEnd: 1340,
  ash: 1400,
  back: 1550,
};
