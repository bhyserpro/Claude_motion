import {assertTiling, sceneMap, scenesFromTimecodes, totalFrames} from '../../lib/timing';

// Серия 4. «Доза». Патч №1 (новый темп): два дозиметра сразу, акт № 2 за речью Глеба, осада 35 с
// с одной драматической тишиной перед щелчком. Реплики привязаны к сценам (voice/lines.py: scene, pos).
export const EP4_SCENES = scenesFromTimecodes([
  ['hook', '0:00', '0:06'],
  ['recap', '0:06', '0:12'],
  ['dosimeters', '0:12', '0:30.5'],
  ['act', '0:30.5', '1:11.5'],
  ['siege', '1:11.5', '1:46.5'],
  ['dose', '1:46.5', '2:00.2'],
  ['end', '2:00.2', '2:03.7'],
]);
export const EP4_FRAMES = totalFrames(EP4_SCENES);
assertTiling(EP4_SCENES, EP4_FRAMES, 'Ep4');
export const EP4 = sceneMap(EP4_SCENES);
