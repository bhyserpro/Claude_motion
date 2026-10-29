import {EP1_FRAMES} from './ep1/timing';
import {EP2_FRAMES} from './ep2/timing';
import {EP3_FRAMES} from './ep3/timing';
import {EP4_FRAMES} from './ep4/timing';
import {EP5_FRAMES} from './ep5/timing';

/** Длительность каждой серии в кадрах: серии, подогнанные под озвучку, длиннее 3:00. */
export const EPISODE_FRAMES = [EP1_FRAMES, EP2_FRAMES, EP3_FRAMES, EP4_FRAMES, EP5_FRAMES];
export const FILM_FRAMES = EPISODE_FRAMES.reduce((a, b) => a + b, 0);
