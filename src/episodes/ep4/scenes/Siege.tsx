import React from 'react';
import {AbsoluteFill, Easing, interpolate, useCurrentFrame} from 'remotion';
import {DSvg, Stage25D} from '../../../components/Stage25D';
import {Nina} from '../../../components/Characters/Nina';
import {POSES} from '../../../components/Characters/Rig';
import {CAM0, camKeys, handheld, impact} from '../../../lib/camera';
import {GeigerTrack, Snd} from '../../common/audio';
import {CarSideLayers, SIDE_FEET} from '../../common/sets';
import {EP2_CAMP} from '../../ep2/cast';
import {PalmOnGlass, WindowFace, WIN} from '../faces';

// лица в окнах: окно, сдвиг, кадр появления
const FACES: [number, number, number][] = [
  [9, 0, 0],
  [5, -40, 30],
  [12, 30, 55],
  [4, 50, 80],
  [8, -60, 100],
  [13, 0, 125],
  [6, 0, 150],
  [10, 40, 170],
  [7, 0, 195],
  [9, 110, 215],
  [5, 100, 240],
  [12, -80, 260],
  [4, -70, 285],
  [8, 80, 305],
];
const OFF = [200, 260, 320, 380]; // секции гаснут — каждые 2 с
const PULL = 440; // рывок дверей
const HUSH = 600; // единственная «драматическая тишина» серии (патч №1: до 1,5 с) — они слушают
const CLICK = 645; // щелчок дозиметра Нины
const STOP = CLICK + 65;
const AWAY = CLICK + 110;
const COAT_WIN = 5;
const NINA_X = 485;

/**
 * Лица в окнах каждые ~0,7 с, ладони, скрип, шёпот «Не дышать…» (E4-N02). Свет гаснет секция за секцией,
 * рывок дверей, скрип ладоней; 1,5 с полной тишины — щелчок, все поворачиваются; уходят; в окне — пальто.
 */
export const Ep4Siege: React.FC<{dur: number}> = ({dur}) => {
  const frame = useCurrentFrame();
  const turn = interpolate(frame, [CLICK + 6, CLICK + 18], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.bezier(0.7, 0, 0.3, 1)});
  const em = [0, 1, 2, 3, 4].map((b) => {
    const order = [4, 3, 0, 2]; // секции гаснут по очереди; секция с Ниной — последней
    const k = order.indexOf(b);
    const base = k >= 0 ? (frame >= OFF[k] ? 0 : 0.8) : frame >= AWAY + 150 ? 0.18 : 0.55;
    return base;
  });
  const lamp = interpolate(frame, [OFF[0], OFF[3]], [0.7, 0.32], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  let cam = handheld({...CAM0}, frame, 1.5, 'sg');
  cam = impact(cam, frame, PULL, 6, 50, 'pull');
  const push = interpolate(frame, [AWAY + 150, dur], [1, 1.45], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.inOut(Easing.cubic)});
  const w = WIN[COAT_WIN];
  cam = {...cam, zoom: push, shakeX: cam.shakeX - (w.x + w.w / 2 - 960) * (push - 1), shakeY: cam.shakeY + (540 - (w.y + w.h / 2)) * (push - 1)};
  return (
    <AbsoluteFill>
      <Stage25D cam={cam} fogEnd={10}>
        <CarSideLayers
          frame={frame}
          id="sg"
          light="emergency"
          lamp={lamp}
          emergencyLamp={em}
          dirt={0.8}
          coatsOnFloor
          poles={false}
          actors={EP2_CAMP.filter((a) => !['semyon', 'korneev', 'nina'].includes(a.id)).map((a) => ({...a, ep: 4}))}
          outside={
            <>
              {FACES.map(([wi, dx, at], i) => {
                const win = WIN[wi];
                const appear = interpolate(frame, [at, at + 45, AWAY + i * 9, AWAY + 60 + i * 9], [0, 1, 1, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
                const toward = win.x + win.w / 2 + dx > NINA_X ? -0.75 : 0.75;
                return <WindowFace key={i} w={win} seed={`sg${i}`} appear={appear} dx={dx} yaw={toward * turn} scale={0.56 + (i % 3) * 0.05} frame={frame} />;
              })}
              <WindowFace w={w} seed="coat" coat appear={interpolate(frame, [AWAY + 60, AWAY + 160], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'})} frame={frame} />
            </>
          }
          glass={(win, i) => {
            const f = FACES.find((x) => x[0] === i);
            if (!f) return null;
            const press = interpolate(frame, [f[2] + 30, f[2] + 60, AWAY, AWAY + 50], [0, 1, 1, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
            return <PalmOnGlass w={win} press={press} side={i % 2 ? 1 : -1} seed={`pg${i}`} />;
          }}
          wallOverlay={
            <DSvg>
              <Nina x={NINA_X} y={SIDE_FEET} scale={0.41} lod={2} light="emergency" episode={4} frame={frame} pose={{...POSES.sitFront, armL: [-8, 115], armR: [-8, 115]}} holdR="dosimeterNina" breathe={false} />
            </DSvg>
          }
        />
      </Stage25D>
      {/* звук: скрип ладоней, свет гаснет, рывок дверей, долгая тишина, щелчки */}
      <Snd src="tunnel_drone.wav" dur={PULL + 60} vol={0.45} loop trim={60} fadeOut={40} />
      {FACES.filter((_, i) => i % 3 === 0).map((f, i) => (
        <Snd key={i} src="glass_squeak.wav" from={f[2] + 40} dur={46} vol={0.45} trim={i * 3} />
      ))}
      {OFF.map((f, i) => (
        <Snd key={`o${i}`} src="noise_cut.wav" from={f} dur={12} vol={0.3} />
      ))}
      <Snd src="scrape.wav" from={PULL} dur={70} vol={0.7} />
      <Snd src="knock.wav" from={PULL + 6} dur={30} vol={0.9} />
      <Snd src="knock.wav" from={PULL + 26} dur={30} vol={0.8} />
      <Snd src="glass_squeak.wav" from={PULL + 70} dur={40} vol={0.4} trim={6} />
      <Snd src="knock.wav" from={PULL + 110} dur={30} vol={0.45} />
      <Snd src="heartbeat.wav" from={PULL + 30} dur={HUSH - PULL - 30} vol={0.3} loop fadeIn={20} fadeOut={6} />
      <GeigerTrack segs={[[CLICK, 2]]} end={STOP} vol={0.9} />
      <Snd src="noise_cut.wav" from={STOP} dur={8} vol={0.2} />
      <Snd src="shuffle.wav" from={AWAY} dur={200} vol={0.25} loop fadeOut={60} />
      <Snd src="drip.wav" from={AWAY + 200} dur={14} vol={0.35} />
      <Snd src="tunnel_drone.wav" from={AWAY + 100} dur={dur - AWAY - 100} vol={0.4} loop fadeIn={60} />
    </AbsoluteFill>
  );
};

export const SIEGE = {CLICK, STOP, AWAY};
