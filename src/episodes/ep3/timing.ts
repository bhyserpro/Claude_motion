import {assertTiling, sceneMap, scenesFromTimecodes, totalFrames} from '../../lib/timing';

// Серия 3. «Список». Патч №1 (новый темп): дедукция в кабине, подход к шахте 14 с вместо 27, счёт сидящих,
// возвращение с репликой, финальный план 4 с. Реплики привязаны к сценам (voice/lines.py: scene, pos).
export const EP3_SCENES = scenesFromTimecodes([
  ['hook', '0:00', '0:07.4'],
  ['recap', '0:07.4', '0:13.4'],
  ['cab', '0:13.4', '0:30.9'],
  ['bag', '0:30.9', '0:44.2'],
  ['korneev', '0:44.2', '0:53.7'],
  ['shaft', '0:53.7', '1:34.9'],
  ['list', '1:34.9', '1:51.1'],
  ['face', '1:51.1', '1:57.8'],
]);
export const EP3_FRAMES = totalFrames(EP3_SCENES);
assertTiling(EP3_SCENES, EP3_FRAMES, 'Ep3');
export const EP3 = sceneMap(EP3_SCENES);

// Главная сцена в шахте (кадры относительно её начала). Согласовано с voice/lines.py (pos реплик E3-N05…E3-09).
export const SHAFT = {
  enterChamber: 112, // «Наверху шёл дождь» — луч вверх по лестнице
  findThem: 218, // «Три…» — луч находит сидящих
  god: 420, // «Господи…»
  turn: 470, // синхронный поворот голов за 12 кадров
  finger: 510, // палец к губам за 40 кадров
  panic: 590,
  silence: 760,
  touch: 865,
  touchEnd: 965,
  ash: 995,
  back: 1145,
};
