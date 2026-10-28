import React from 'react';
import {AbsoluteFill, Sequence, useCurrentFrame} from 'remotion';
import {Layer, Stage25D} from '../../../components/Stage25D';
import {SubliminalFlash} from '../../../components/FX';
import {HookText} from '../../../components/Text';
import {CarCorridor} from '../../../components/Props/MetroCar';
import {COAT_POSES} from '../../../components/Characters/CoatFigure';
import {camKeys, handheld} from '../../../lib/camera';
import {Snd} from '../../common/audio';
import {corridorItems} from '../../common/sets';
import {WatchShot} from '../../common/closeups';
import {EP1_CORRIDOR} from '../cast';

/** Вагон вдоль прохода, тёплый свет. dolly — продвижение камеры. */
export const WarmCorridor: React.FC<{z0: number; z1: number; dur: number; red?: boolean; coat?: boolean; farFigure?: number}> = ({
  z0,
  z1,
  dur,
  red = false,
  coat = false,
  farFigure = 0,
}) => {
  const frame = useCurrentFrame();
  const z = z0 + (z1 - z0) * Math.min(1, frame / dur);
  const cam = handheld(camKeys(frame, [{f: 0}]), frame, 3, 'hk');
  const light = red ? 'emergency' : 'warm';
  // в сублиминальной вставке вагон пуст — остаётся только он
  const items = coat ? [] : corridorItems(EP1_CORRIDOR, light, frame);
  if (coat) {
    items.push(...corridorItems([{id: 'coat', side: 1, z: 9.2, stand: 0.0, pose: COAT_POSES.stand_far, extra: {lod: 1}}], 'silhouette', frame, 0));
  }
  if (farFigure > 0) {
    // едва различимая тёмная фигура у торцевой двери — видна раньше, чем её «заметят»
    items.push(...corridorItems([{id: 'coat', side: 1, z: 17.2, stand: -0.25, pose: COAT_POSES.stand_far, extra: {lod: 0, opacity: farFigure}}], 'dark', frame, 0.4));
  }
  return (
    <Stage25D cam={cam}>
      <Layer z={1}>
        <CarCorridor id={red ? 'hkr' : 'hk'} pcam={{x: 0.05, y: 0.02, z, f: 900}} light={light} emergencyLamp={red ? 1 : 0} fog={red ? '#0a0202' : '#07090A'} fogEnd={red ? 18 : 26} items={items} />
      </Layer>
    </Stage25D>
  );
};

/** ХУК серии 1: вагон, часы 18:39, сублиминальная вставка на 5-й секунде. */
export const Ep1Hook: React.FC<{dur: number}> = ({dur}) => {
  return (
    <AbsoluteFill>
      <Sequence durationInFrames={112}>
        <WarmCorridor z0={0.3} z1={1.9} dur={112} farFigure={0.9} />
      </Sequence>
      <Sequence from={112} durationInFrames={dur - 112}>
        <WatchShotRun />
      </Sequence>
      <SubliminalFlash at={150} dur={3}>
        <WarmCorridor z0={3.2} z1={3.3} dur={3} red coat />
      </SubliminalFlash>
      <HookText lines={['Ты едешь домой с работы.', 'Через восемь минут твоего города **не станет**.']} start={3} end={dur - 4} top={0.6} />
      <Snd src="rails_loop.wav" dur={dur} vol={0.75} loop />
      <Snd src="tunnel_drone.wav" dur={dur} vol={0.35} loop />
      <Snd src="hit.wav" from={150} dur={12} vol={0.5} />
    </AbsoluteFill>
  );
};

const WatchShotRun: React.FC = () => {
  const frame = useCurrentFrame();
  // 18:39:12 → секундная стрелка идёт
  const s = 12 + frame / 30;
  return <WatchShot h={18} m={39} s={s} zoom={0.9 + frame * 0.0012} dy={-150} />;
};
