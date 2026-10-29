import {assertTiling, sceneMap, scenesFromTimecodes, totalFrames} from '../../lib/timing';

// Серия 1. «18:47» — все длительности серии задаются здесь.
// Под озвучку: «Счёт» +4 с (шёпот 11–14 под цифры и монолог), «Аварийный свет» +3 с (оповещение целиком) — 3:07.
// Реплики привязаны к сценам (voice/lines.py: scene, pos), поэтому voice/process.py сам переставит их после правки.
export const EP1_SCENES = scenesFromTimecodes([
  ['hook', '0:00', '0:07'],
  ['ride', '0:07', '0:30'],
  ['count', '0:30', '0:59'],
  ['watch', '0:59', '1:14'],
  ['impact', '1:14', '1:29'],
  ['emergency', '1:29', '1:57'],
  ['dosimeter', '1:57', '2:17'],
  ['pavelLeaves', '2:17', '2:32'],
  ['fifteen', '2:32', '2:57'],
  ['end', '2:57', '3:07'],
]);
export const EP1_FRAMES = totalFrames(EP1_SCENES);
assertTiling(EP1_SCENES, EP1_FRAMES, 'Ep1');
export const EP1 = sceneMap(EP1_SCENES);
