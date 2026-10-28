import {EP_FRAMES} from '../../config';
import {assertTiling, sceneMap, scenesFromTimecodes} from '../../lib/timing';

// Серия 4. «Доза»
export const EP4_SCENES = scenesFromTimecodes([
  ['hook', '0:00', '0:06'],
  ['recap', '0:06', '0:12'],
  ['dosimeters', '0:12', '0:40'],
  ['act', '0:40', '1:30'],
  ['siege', '1:30', '2:20'],
  ['dose', '2:20', '2:50'],
  ['end', '2:50', '3:00'],
]);
assertTiling(EP4_SCENES, EP_FRAMES, 'Ep4');
export const EP4 = sceneMap(EP4_SCENES);

// листы акта № 2 (без летербокса), относительно начала сцены act
export const ACT2_PAPER: [number, number][] = [
  [150, 300],
  [440, 600],
  [680, 940],
];
