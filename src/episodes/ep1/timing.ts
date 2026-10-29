import {assertTiling, sceneMap, scenesFromTimecodes, totalFrames} from '../../lib/timing';

// Серия 1. «18:47» — все длительности серии задаются здесь.
// Патч №1 (новый темп): реплики идут почти встык, пустоты закрыты счётом, цитатами из договора и событиями;
// серия короче 3:00 — так решил заказчик. Реплики привязаны к сценам (voice/lines.py: scene, pos),
// voice/process.py сам переставит их после правки таймкодов.
export const EP1_SCENES = scenesFromTimecodes([
  ['hook', '0:00', '0:06'],
  ['ride', '0:06', '0:26.8'],
  ['count', '0:26.8', '0:48.1'],
  ['watch', '0:48.1', '0:56.9'],
  ['impact', '0:56.9', '1:08.3'],
  ['emergency', '1:08.3', '1:32.7'],
  ['dosimeter', '1:32.7', '1:43.7'],
  ['pavelLeaves', '1:43.7', '1:57.1'],
  ['fifteen', '1:57.1', '2:13.9'],
  ['end', '2:13.9', '2:17.9'],
]);
export const EP1_FRAMES = totalFrames(EP1_SCENES);
assertTiling(EP1_SCENES, EP1_FRAMES, 'Ep1');
export const EP1 = sceneMap(EP1_SCENES);
