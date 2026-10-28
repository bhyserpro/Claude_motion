import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {DSvg, Layer, Stage25D} from './components/Stage25D';
import {FilmGrain, FlashlightMask, Letterbox, Vignette} from './components/FX';
import {Monologue, Timestamp} from './components/Text';
import {camKeys, handheld} from './lib/camera';
import {CarCorridor, CarOutside, CarPoles, CarWall, corridorSeat, SEAT_Y, seatXs} from './components/Props/MetroCar';
import {Passenger} from './components/Characters/Passenger';
import {Gleb} from './components/Characters/Gleb';
import {Nina, NINA_POSES} from './components/Characters/Nina';
import {CoatFigure, COAT_POSES} from './components/Characters/CoatFigure';
import {POSES} from './components/Characters/Rig';
import {rigScaleAt, fogAt, Projector} from './lib/persp';

/** Тестовая композиция: параллакс, маска фонаря, вагон сбоку и вдоль. */
export const Sandbox: React.FC = () => {
  const frame = useCurrentFrame();
  if (frame < 100) {
    const cam = handheld(camKeys(frame, [{f: 0, dolly: 0, x: 0}, {f: 100, dolly: 0.3, x: 80}]), frame);
    const xs = seatXs();
    return (
      <AbsoluteFill>
        <Stage25D cam={cam} fogEnd={9}>
          <Layer z={4}>
            <CarOutside frame={frame} motion={1} light="warm" />
          </Layer>
          <Layer z={1.6}>
            <CarWall light="warm" id="sbw" />
            <DSvg>
              {xs.slice(5, 12).map((x, i) => (
                <Passenger key={i} seed={`p${i}`} x={x} y={SEAT_Y} scale={0.43} lod={1} pose={POSES.sitFront} />
              ))}
              <Nina x={xs[12]} y={SEAT_Y} scale={0.43} lod={1} pose={NINA_POSES.sitFront} holdR="dosimeterNina" />
            </DSvg>
          </Layer>
          <Layer z={1.15}>
            <DSvg>
              <Gleb x={1250} y={930} scale={0.62} view="three_quarter" lod={2} frame={frame} />
            </DSvg>
          </Layer>
          <Layer z={0.6} blur={8}>
            <CarPoles light="warm" />
          </Layer>
        </Stage25D>
        <Vignette strength={0.6} />
        <FilmGrain />
        <Letterbox />
        <Timestamp text="ДЕНЬ 0 — 18:39" />
      </AbsoluteFill>
    );
  }
  const f = frame - 100;
  const dark = frame >= 200;
  const pcam = {x: 0, y: dark ? 0.1 : 0, z: -1 + f * (dark ? 0.004 : 0.02), f: 950};
  const people: [number, -1 | 1, string][] = [
    [2.0, -1, 'a'],
    [2.6, 1, 'b'],
    [5.6, -1, 'c'],
    [6.3, 1, 'd'],
    [7.0, -1, 'e'],
    [11.5, 1, 'f'],
    [12.4, -1, 'g'],
  ];
  return (
    <AbsoluteFill>
      <Stage25D cam={handheld(camKeys(0, [{f: 0}]), frame)}>
        <Layer z={1}>
          <CarCorridor
            id="sbc"
            pcam={pcam}
            light={dark ? 'flashlight' : 'warm'}
            wetSeat={dark ? {side: 1, z: 13.2, a: 1} : undefined}
            items={[
              ...people.map(([z, sd, s]) => ({
                z,
                render: (pr: Projector) => {
                  const p = corridorSeat(sd, z);
                  const [x, y] = pr.P(p.x, p.y, z);
                  return <Passenger seed={s} x={x} y={y} scale={rigScaleAt(pr, z)} lod={1} view="front" pose={POSES.sitFront} light={dark ? 'flashlight' : 'warm'} fog={fogAt(pr.depth(z), 3, 26) * (dark ? 0 : 1)} />;
                },
              })),
              ...(dark
                ? [
                    {
                      z: 13.2,
                      render: (pr: Projector) => {
                        const p = corridorSeat(1, 13.2);
                        const [x, y] = pr.P(p.x, p.y, 13.2);
                        return <CoatFigure x={x} y={y} scale={rigScaleAt(pr, 13.2)} lod={1} pose={COAT_POSES.sit_head_down} light="flashlight" />;
                      },
                    },
                  ]
                : []),
            ]}
          />
        </Layer>
        {dark ? <FlashlightMask id="ph" beams={[{sx: 960, sy: 1100, tx: 1180, ty: 560, r: 230, intensity: 1}]} /> : null}
      </Stage25D>
      <Vignette strength={0.6} />
      <FilmGrain />
      <Letterbox />
      <Monologue start={0} lines={['Четырнадцать. Я всегда считаю.']} />
    </AbsoluteFill>
  );
};
