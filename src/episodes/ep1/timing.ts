import {EP_FRAMES} from '../../config';
import {assertTiling, sceneMap, scenesFromTimecodes} from '../../lib/timing';

// Серия 1. «18:47» — все длительности серии задаются здесь.
export const EP1_SCENES = scenesFromTimecodes([
  ['hook', '0:00', '0:07'],
  ['ride', '0:07', '0:30'],
  ['count', '0:30', '0:55'],
  ['watch', '0:55', '1:10'],
  ['impact', '1:10', '1:25'],
  ['emergency', '1:25', '1:50'],
  ['dosimeter', '1:50', '2:10'],
  ['pavelLeaves', '2:10', '2:25'],
  ['fifteen', '2:25', '2:50'],
  ['end', '2:50', '3:00'],
]);
assertTiling(EP1_SCENES, EP_FRAMES, 'Ep1');
export const EP1 = sceneMap(EP1_SCENES);
