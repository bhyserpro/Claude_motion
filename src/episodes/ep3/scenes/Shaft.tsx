import React from 'react';
import {AbsoluteFill, Easing, interpolate, random, Sequence, useCurrentFrame} from 'remotion';
import {DSvg, Layer, Stage25D} from '../../../components/Stage25D';
import {Beam, FlashlightMask} from '../../../components/FX';
import {Monologue, PencilNumber, Subtitle} from '../../../components/Text';
import {useWordFrame} from '../../../components/Voice';
import {Passage, PASS} from '../../../components/Props/Passage';
import {ShaftAsh, ShaftBack, ShaftPiles, SHAFT_FLOOR} from '../../../components/Props/VentShaft';
import {Blind} from '../../../components/Characters/Blind';
import {CoatFigure} from '../../../components/Characters/CoatFigure';
import {Korneev, KORNEEV_POSES} from '../../../components/Characters/Korneev';
import {Gleb, GLEB_POSES} from '../../../components/Characters/Gleb';
import {walkPose, LIGHT_FN} from '../../../components/Characters/Rig';
import {camKeys, handheld, impact} from '../../../lib/camera';
import {fbm1} from '../../../lib/noise';
import {Snd} from '../../common/audio';
import {placeAt} from '../../common/cast';
import {AshShot, LongHand} from '../../common/closeups';
import {headCloseY} from '../../common/tunnelShot';
import {SHAFT} from '../timing';

// --- рассадка «засвеченных» вдоль стен камеры
type Seat = {x: number; y: number; s: number; seed: string; facing: 1 | -1; z: 'back' | 'side'};
const SEATED: Seat[] = (() => {
  const out: Seat[] = [];
  // дальний ряд у задней стены (слой z=2.1)
  for (let i = 0; i < 16; i++) {
    const x = -520 + i * 190 + (random(`sx${i}`) - 0.5) * 50;
    if (x > 720 && x < 1200) continue;
    out.push({x, y: SHAFT_FLOOR - 4, s: 0.36 + random(`ss${i}`) * 0.04, seed: `shaft-b${i}`, facing: x < 960 ? 1 : -1, z: 'back'});
  }
  // ближний ряд по бокам (слой z=1.55)
  for (let i = 0; i < 9; i++) {
    const left = i < 5;
    const x = left ? -300 + i * 150 : 1650 + (i - 5) * 160;
    out.push({x, y: SHAFT_FLOOR + 70, s: 0.46, seed: `shaft-n${i}`, facing: left ? 1 : -1, z: 'side'});
  }
  return out;
})();
const COAT_X = 1560;

const turnYaw = (frame: number) =>
  interpolate(frame, [SHAFT.turn, SHAFT.turn + 12], [0, -0.85], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.bezier(0.7, 0, 0.3, 1)});

/** Камера вентшахты: лестница вверх, серый свет, пепел; горы одежды; они сидят вдоль стен. */
export const Chamber: React.FC<{offset: number}> = ({offset}) => {
  const lf = useCurrentFrame();
  const frame = lf + offset; // кадр относительно начала сцены shaft
  const yaw = turnYaw(frame);
  const finger = interpolate(frame, [SHAFT.finger, SHAFT.finger + 40], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const panic = frame >= SHAFT.panic;
  const lost = frame >= SHAFT.panic + 50; // фонарь Корнеева выбит, катится по полу
  let cam = handheld(camKeys(frame, [{f: SHAFT.enterChamber, x: -120, y: -260, zoom: 1.0}, {f: SHAFT.findThem, x: 60, y: 60, zoom: 1.12}, {f: SHAFT.god, x: 160, y: 80, zoom: 1.22}]), frame, panic && !lost ? 9 : 3, 'ch');
  if (panic) cam = impact(cam, frame, SHAFT.panic + 48, 22, 30, 'kfall');
  // луч Корнеева: вверх по лестнице → вниз на кучи → по стенам → находит их → мечется
  const keys = [SHAFT.enterChamber, SHAFT.enterChamber + 45, SHAFT.findThem - 30, SHAFT.findThem, SHAFT.findThem + 90, SHAFT.god];
  let tx = interpolate(frame, keys, [960, 960, 980, 520, 1500, 1520], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  let ty = interpolate(frame, keys, [-60, 120, 860, 840, 820, 800], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  if (panic && !lost) {
    tx = 960 + (random(`pk${Math.floor(frame / 3)}`) - 0.5) * 1700;
    ty = 300 + random(`pky${Math.floor(frame / 3)}`) * 700;
  }
  const kbeam: Beam = lost
    ? {sx: 760, sy: 1000, tx: 1300, ty: 990, r: 260, intensity: frame > SHAFT.silence - 20 ? 0.35 : 0.6, stretch: 2.2}
    : {sx: 700, sy: 640, tx, ty, r: frame > SHAFT.findThem - 20 && !panic ? 430 : 330, intensity: 1, stretch: 1.5};
  const gbeam: Beam = {sx: 1220, sy: 700, tx: tx * 0.6 + 400, ty: ty * 0.7 + 280, r: 250, intensity: frame < SHAFT.turn ? 0.5 : 0};
  const blind = (st: Seat, eyesOnly = false) => (
    <Blind key={st.seed + (eyesOnly ? 'e' : '')} x={st.x} y={st.y} scale={st.s} seed={st.seed} kind="A" facing={st.facing} headYaw={yaw * st.facing} light="flashlight" lod={1} eyesOnly={eyesOnly} />
  );
  const coat = (eyesOnly = false) => (
    <CoatFigure x={COAT_X} y={SHAFT_FLOOR + 70} scale={0.5} view="front" headUp fingerToLips={finger} light="flashlight" lod={2} eyesOnly={eyesOnly} pose={{hipDrop: 1.05, thighScale: 0.3, legL: [3, 0], legR: [3, 0], sit: true, headYaw: yaw * 0.3}} puddle={!eyesOnly} />
  );
  const kx = 620;
  return (
    <Stage25D cam={cam} fogEnd={9}>
      <Layer z={2.3}>
        <ShaftBack light="flashlight" id="shb" />
      </Layer>
      <Layer z={2.1}>
        <DSvg>{SEATED.filter((s) => s.z === 'back').map((s) => blind(s))}</DSvg>
      </Layer>
      <Layer z={1.9}>
        <ShaftPiles light="flashlight" id="shp" />
      </Layer>
      <Layer z={1.55}>
        <DSvg>
          {SEATED.filter((s) => s.z === 'side').map((s) => blind(s))}
          {coat()}
        </DSvg>
      </Layer>
      <Layer z={1.2}>
        <DSvg>
          {!lost ? (
            <Korneev x={kx} y={1060} scale={0.62} view="three_quarter" facing={1} lod={2} light="flashlight" frame={frame} shout={panic} pose={panic ? KORNEEV_POSES.panic_flashlight : {armR: [70, 10]}} holdR="baton" />
          ) : null}
        </DSvg>
      </Layer>
      <Layer z={1.6}>
        <ShaftAsh seed="ash1" frameOffset={offset} />
      </Layer>
      <FlashlightMask id="chm" darkness={0.975} beams={[kbeam, gbeam]} haze={0.16} />
      {/* глаза светятся в темноте — поверх маски */}
      <Layer z={2.1} opacity={0.55}>
        <DSvg>{SEATED.filter((s) => s.z === 'back').map((s) => blind(s, true))}</DSvg>
      </Layer>
      <Layer z={1.55} opacity={0.6}>
        <DSvg>
          {SEATED.filter((s) => s.z === 'side').map((s) => blind(s, true))}
          {coat(true)}
        </DSvg>
      </Layer>
      <Layer z={1.0} blur={6}>
        <DSvg>
          <rect x={-600} y={-400} width={500} height={1900} fill="#050606" />
          <rect x={2020} y={-400} width={600} height={1900} fill="#050606" />
        </DSvg>
      </Layer>
    </Stage25D>
  );
};

/** Узкий проход. Где-то рядом чужое дыхание. */
const Corridor: React.FC<{back?: boolean}> = ({back = false}) => {
  const frame = useCurrentFrame();
  const z = back ? interpolate(frame, [0, 90], [6, 3.4]) : interpolate(frame, [0, SHAFT.enterChamber], [0, 3.2]);
  const pcam = {x: 0.05, y: -0.05, z, f: 900};
  const ph = (frame / 32) % 1;
  return (
    <Stage25D cam={handheld(camKeys(frame, [{f: 0}]), frame, 3.5, 'pas')}>
      <Layer z={1}>
        <Passage
          pcam={pcam}
          light="flashlight"
          length={back ? 9 : 14}
          endGlow={back ? 0.35 : 0}
          items={
            back
              ? []
              : [
                  {
                    z: z + 2.4,
                    render: (pr) => {
                      const p = placeAt(pr, -0.1, PASS.FLOOR, z + 2.4, 2, 16);
                      return <Korneev x={p.x} y={p.y} scale={p.scale} view="back" light="flashlight" frame={frame} pose={walkPose(ph, 0.6, {armR: [60, 10]})} holdR="baton" />;
                    },
                  },
                ]
          }
        />
      </Layer>
      <FlashlightMask
        id="pasm"
        darkness={0.975}
        beams={[
          {sx: 1000, sy: 560, tx: 960, ty: 560, r: back ? 200 : 260, intensity: back ? 0.4 : 1},
          {sx: 1250, sy: 1150, tx: 960, ty: 700, r: 330, intensity: back ? 0.2 : 0.55},
        ]}
        haze={0.12}
      />
    </Stage25D>
  );
};

/** Глеб замер, не дышит. Его лицо в слабом свете упавшего фонаря; мимо проходят они. */
export const Frozen: React.FC<{offset: number}> = ({offset}) => {
  const lf = useCurrentFrame();
  const frame = lf + offset;
  const S = 2.6;
  const y = headCloseY(182, S, 500);
  const touch = interpolate(frame, [SHAFT.touch, SHAFT.touch + 60, SHAFT.touchEnd - 20, SHAFT.touchEnd], [0, 1, 1, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const feel = Math.sin((frame - SHAFT.touch) / 9) * 0.08 * touch;
  const passing = frame < SHAFT.touch;
  const ph = ((frame / 36) % 1);
  return (
    <Stage25D cam={handheld(camKeys(frame, [{f: 0}]), frame, 1.2, 'frz')} bg="#020303">
      <DSvg>
        <rect x={-300} y={-300} width={2600} height={1700} fill="#0a0c0c" />
        {passing ? (
          <g opacity={0.9}>
            {[0, 1, 2].map((i) => (
              <Blind key={i} x={-200 + ((frame * 3.2 + i * 520) % 2400)} y={1500} scale={1.3} seed={`pass${i}`} kind="C" view="profile" facing={1} walkT={(ph + i * 0.3) % 1} light="dark" lod={1} />
            ))}
          </g>
        ) : null}
        <Gleb x={1060} y={y} scale={S} view="three_quarter" facing={-1} episode={3} lod={2} light="flashlight" fog={0.45} fogColor="#000000" breathe={false} pose={{...GLEB_POSES.freeze_hold_breath, headPitch: 0.1}} />
        {touch > 0 ? (
          <g transform={`translate(${2050 - touch * 760},${980 - touch * 330}) rotate(${-140 + touch * 18 + feel * 40})`}>
            <LongHand c={LIGHT_FN.flashlight} len={460} skin="#C9C2B4" shade="#8C8E8C" pose="reach" strips />
          </g>
        ) : null}
      </DSvg>
      <FlashlightMask id="frzm" darkness={0.9} beams={[{sx: 900, sy: 1300, tx: 980, ty: 640, r: 520, intensity: 0.7}]} haze={0.04} />
    </Stage25D>
  );
};

/** Цифры, которые Глеб считает по сидящим (E3-N06): где пишутся (кадр шахты, по лучу). */
const COUNTED: {word: string; text: string; x: number; y: number}[] = [
  {word: 'Три', text: '3', x: 1090, y: 640},
  {word: 'четыре', text: '4', x: 1270, y: 625},
  {word: 'семь', text: '7', x: 1480, y: 640},
  {word: 'десять', text: '10', x: 1720, y: 630},
];

/** Карандашная черта поперёк цифры: «Не считай». */
const Strike: React.FC<{x: number; y: number; at: number; until: number}> = ({x, y, at, until}) => {
  const frame = useCurrentFrame();
  if (frame < at || frame >= until) return null;
  const p = interpolate(frame, [at, at + 6], [0, 1], {extrapolateRight: 'clamp'});
  return (
    <svg width={1920} height={1080} style={{position: 'absolute', inset: 0, overflow: 'visible'}}>
      <line x1={x - 44} y1={y + 18} x2={x - 44 + 92 * p} y2={y + 18 - 40 * p} stroke="#C9C3B4" strokeWidth={5} strokeLinecap="round" />
    </svg>
  );
};

/**
 * Главная хоррор-сцена сериала. Вход под «Сверху сыпался пепел…» (E3-N05), счёт сидящих (E3-N06),
 * «Господи…» (E3-06), паника (E3-07), тишина с задержанным дыханием (E3-08) и «Тсс» (E3-09).
 */
export const Ep3Shaft: React.FC<{dur: number}> = ({dur}) => {
  const counted = COUNTED.map((c) => useWordFrame('E3-N06', c.word, SHAFT.findThem + 10));
  const dont = useWordFrame('E3-N06', 'Не', SHAFT.findThem + 120);
  const rain = useWordFrame('E3-N05', 'Наверху', SHAFT.enterChamber);
  return (
    <AbsoluteFill>
      <Sequence durationInFrames={SHAFT.enterChamber}>
        <Corridor />
      </Sequence>
      <Sequence from={SHAFT.enterChamber} durationInFrames={SHAFT.silence - SHAFT.enterChamber}>
        <Chamber offset={SHAFT.enterChamber} />
      </Sequence>
      <Sequence from={SHAFT.panic + 70} durationInFrames={60}>
        <AbsoluteFill style={{background: '#000'}} />
      </Sequence>
      <Sequence from={SHAFT.silence} durationInFrames={SHAFT.ash - SHAFT.silence}>
        <Frozen offset={SHAFT.silence} />
      </Sequence>
      <Sequence from={SHAFT.ash} durationInFrames={50}>
        <AshShot part="coat" />
      </Sequence>
      <Sequence from={SHAFT.ash + 50} durationInFrames={50}>
        <AshShot part="hands" />
      </Sequence>
      <Sequence from={SHAFT.ash + 100} durationInFrames={SHAFT.back - SHAFT.ash - 100}>
        <AshShot part="hair" />
      </Sequence>
      <Sequence from={SHAFT.back} durationInFrames={dur - SHAFT.back}>
        <Corridor back />
      </Sequence>
      {/* счёт сидящих — цифры на словах, на «Не считай» перечёркнуты */}
      <div style={{position: 'absolute', inset: 0}}>
        {COUNTED.map((c, i) => (
          <React.Fragment key={c.text}>
            <PencilNumber x={c.x} y={c.y} text={c.text} at={counted[i]} until={SHAFT.god} size={60} />
            {counted[i] < SHAFT.god ? <Strike x={c.x} y={c.y} at={dont + i * 3} until={SHAFT.god} /> : null}
          </React.Fragment>
        ))}
      </div>
      <Monologue voice="E3-N05" start={8} end={rain} lines={['Сверху сыпался пепел. Мокрый.']} />
      <Monologue voice="E3-N05" start={rain} end={SHAFT.findThem} lines={['Наверху шёл дождь.', 'Вот почему он был мокрый.']} />
      <Monologue voice="E3-N06" start={dont - 2} end={SHAFT.god} lines={['Не считай. Не считай.']} />
      <Subtitle voice="E3-06" who="КОРНЕЕВ" text="Господи…" start={SHAFT.god} end={SHAFT.turn + 4} />
      <Subtitle voice="E3-07" who="КОРНЕЕВ" text="Назад! Пошли назад! Не трогай меня!" />
      <Subtitle voice="E3-09" text="Тсс." italic small />
      {/* звук */}
      <Snd src="tunnel_drone.wav" dur={SHAFT.god} vol={0.5} loop trim={30} fadeOut={20} />
      <Snd src="breath_close_left.wav" dur={SHAFT.enterChamber + 200} vol={0.55} loop fadeIn={40} />
      <Snd src="drip.wav" from={SHAFT.enterChamber + 40} dur={15} vol={0.3} />
      <Snd src="drip.wav" from={SHAFT.findThem - 20} dur={15} vol={0.25} />
      <Snd src="shuffle.wav" from={SHAFT.turn} dur={14} vol={0.6} rate={1.6} />
      <Snd src="scream.wav" from={SHAFT.panic + 10} dur={42} vol={0.95} />
      <Snd src="scream_muffled.wav" from={SHAFT.panic + 52} dur={66} vol={0.8} fadeOut={8} />
      <Snd src="scrape.wav" from={SHAFT.panic + 40} dur={70} vol={0.45} />
      <Snd src="knock.wav" from={SHAFT.panic + 48} dur={30} vol={0.8} />
      <Snd src="heartbeat.wav" from={SHAFT.silence} dur={SHAFT.ash - SHAFT.silence} vol={0.7} loop fadeIn={20} />
      <Snd src="shuffle.wav" from={SHAFT.silence} dur={SHAFT.touch - SHAFT.silence} vol={0.35} loop />
      <Snd src="breath_close.wav" from={SHAFT.touch - 20} dur={SHAFT.touchEnd - SHAFT.touch + 30} vol={0.4} loop />
      <Snd src="tunnel_drone.wav" from={SHAFT.ash} dur={dur - SHAFT.ash} vol={0.4} loop fadeIn={30} />
    </AbsoluteFill>
  );
};
