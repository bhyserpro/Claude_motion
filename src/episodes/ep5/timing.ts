import {EP_FRAMES} from '../../config';
import {assertTiling, sceneMap, scenesFromTimecodes} from '../../lib/timing';

// Серия 5. «Акт осмотра»
export const EP5_SCENES = scenesFromTimecodes([
  ['hook', '0:00', '0:06'],
  ['recap', '0:06', '0:12'],
  ['reason', '0:12', '0:40'],
  ['plan', '0:40', '1:10'],
  ['act', '1:10', '1:40'],
  ['horn', '1:40', '2:15'],
  ['hold', '2:15', '2:40'],
  ['surface', '2:40', '2:55'],
  ['end', '2:55', '3:00'],
]);
assertTiling(EP5_SCENES, EP_FRAMES, 'Ep5');
export const EP5 = sceneMap(EP5_SCENES);
export const ACT3_PAPER: [number, number] = [200, 760];
