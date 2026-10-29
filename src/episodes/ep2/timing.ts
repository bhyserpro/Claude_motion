import {assertTiling, sceneMap, scenesFromTimecodes, totalFrames} from '../../lib/timing';

// Серия 2. «Машинист». Патч №1 (новый темп): реплики почти встык, пустоты закрыты пунктом 3.1, Корнеевым,
// дедукцией у гермы, показаниями Нины вслух и счётом стуков. Реплики привязаны к сценам (voice/lines.py: scene, pos).
export const EP2_SCENES = scenesFromTimecodes([
  ['hook', '0:00', '0:06'],
  ['recap', '0:06', '0:12'],
  ['camp', '0:12', '0:36'],
  ['walk', '0:36', '0:53'],
  ['door', '0:53', '1:07'],
  ['act', '1:07', '1:40.8'],
  ['measure', '1:40.8', '2:02.3'],
  ['night', '2:02.3', '2:19.3'],
  ['end', '2:19.3', '2:22.8'],
]);
export const EP2_FRAMES = totalFrames(EP2_SCENES);
assertTiling(EP2_SCENES, EP2_FRAMES, 'Ep2');
export const EP2 = sceneMap(EP2_SCENES);
