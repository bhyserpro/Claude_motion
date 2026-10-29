import {assertTiling, sceneMap, scenesFromTimecodes, totalFrames} from '../../lib/timing';

// Серия 5. «Акт осмотра». Патч №1 (новый темп): воспоминания по словам, «А вы? — А я посчитаю»,
// акт № 3 с отсчётом шагов, одна драматическая тишина после гудка. Реплики привязаны к сценам (voice/lines.py).
export const EP5_SCENES = scenesFromTimecodes([
  ['hook', '0:00', '0:06'],
  ['recap', '0:06', '0:12'],
  ['reason', '0:12', '0:25.8'],
  ['plan', '0:25.8', '0:45.3'],
  ['act', '0:45.3', '1:06.9'],
  ['horn', '1:06.9', '1:41.9'],
  ['hold', '1:41.9', '1:57.9'],
  ['surface', '1:57.9', '2:09.9'],
  ['end', '2:09.9', '2:14.9'],
]);
export const EP5_FRAMES = totalFrames(EP5_SCENES);
assertTiling(EP5_SCENES, EP5_FRAMES, 'Ep5');
export const EP5 = sceneMap(EP5_SCENES);
