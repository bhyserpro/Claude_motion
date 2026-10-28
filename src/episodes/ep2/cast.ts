import {POSES, Pose} from '../../components/Characters/Rig';
import {PASSENGER_POSES} from '../../components/Characters/Passenger';
import {Actor} from '../common/cast';
import {seat, SIDE_FEET} from '../common/sets';

/** Сидит анфас, сломленно: голова опущена, плечи подняты. */
export const SLUMP_FRONT: Pose = {...POSES.sitFront, headPitch: 0.5, headTilt: 12, shrug: 0.08, armL: [-4, 60], armR: [-4, 60]};
export const lie = (dir: 1 | -1 = 1): Pose => ({rootRot: -90 * dir, armL: [10, 30], armR: [6, 20], legL: [6, 10], legR: [-4, 14]});

/** Вагон на третий день: лагерь, пальто на полу. */
export const EP2_CAMP: Actor[] = [
  seat('office', 4, {pose: SLUMP_FRONT, dirt: 0.4}),
  seat('olga', 6, {pose: PASSENGER_POSES.sit_clutch_bag, dirt: 0.4}),
  seat('nina', 8, {pose: {...POSES.sitFront, armL: [-6, 100], armR: [-6, 100]}, ep: 2}),
  seat('student', 9, {pose: SLUMP_FRONT, dirt: 0.4, coatOff: true}),
  seat('oldman', 10, {pose: SLUMP_FRONT, dirt: 0.4}),
  seat('semyon', 11),
  seat('puffer', 13, {pose: SLUMP_FRONT, dirt: 0.4}),
  {id: 'akhmed', x: 1580, y: SIDE_FEET + 40, scale: 0.41, view: 'front', pose: {hipDrop: 2.55, thighScale: 0.3, legL: [30, 0], legR: [30, 0], armL: [30, 40], armR: [30, 40], sit: true}, dirt: 0.4},
  {id: 'worker', x: 330, y: SIDE_FEET + 120, scale: 0.41, view: 'front', pose: lie(1), dirt: 0.5},
  {id: 'teen', x: 1300, y: SIDE_FEET + 110, scale: 0.41, view: 'front', pose: lie(-1), dirt: 0.5},
  {id: 'business', x: -300, y: SIDE_FEET + 115, scale: 0.41, view: 'front', pose: lie(1), dirt: 0.5},
];
