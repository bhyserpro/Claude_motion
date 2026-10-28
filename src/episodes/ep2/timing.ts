import {EP_FRAMES} from '../../config';
import {assertTiling, sceneMap, scenesFromTimecodes} from '../../lib/timing';

// Серия 2. «Машинист»
export const EP2_SCENES = scenesFromTimecodes([
  ['hook', '0:00', '0:06'],
  ['recap', '0:06', '0:12'],
  ['camp', '0:12', '0:35'],
  ['walk', '0:35', '0:55'],
  ['door', '0:55', '1:20'],
  ['act', '1:20', '2:00'],
  ['measure', '2:00', '2:25'],
  ['night', '2:25', '2:50'],
  ['end', '2:50', '3:00'],
]);
assertTiling(EP2_SCENES, EP_FRAMES, 'Ep2');
export const EP2 = sceneMap(EP2_SCENES);

// Вставки акта осмотра № 1 (относительно начала сцены act)
export const ACT1 = {
  paper: [
    [0, 150],
    [230, 380],
    [460, 620],
    [700, 860],
    [940, 1040],
  ] as [number, number][],
};
