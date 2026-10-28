import React from 'react';
import {AbsoluteFill} from 'remotion';
import {Blind} from './components/Characters/Blind';
import {CoatFigure} from './components/Characters/CoatFigure';
import {Gleb, GLEB_POSES} from './components/Characters/Gleb';
import {Korneev} from './components/Characters/Korneev';
import {Nina, NINA_POSES} from './components/Characters/Nina';
import {Passenger} from './components/Characters/Passenger';
import {Pavel} from './components/Characters/Pavel';
import {Light, LOD} from './components/Characters/Rig';
import {Semyon} from './components/Characters/Semyon';
import {FONT_MONO} from './lib/fonts';

export type SheetSection = 'all' | 'heights' | 'gleb' | 'evolution' | 'lights' | 'silhouettes' | 'blind' | 'coat';

type Row = (p: {x: number; y: number; scale: number; light: Light; lod: LOD}) => React.ReactNode;

const CAST: {name: string; draw: Row}[] = [
  {name: 'Глеб', draw: (p) => <Gleb {...p} view="front" pose={GLEB_POSES.stand_idle} holdR="notebook" />},
  {name: 'Нина', draw: (p) => <Nina {...p} view="front" pose={NINA_POSES.stand_idle} holdR="dosimeterNina" />},
  {name: 'Семён', draw: (p) => <Semyon {...p} view="front" holdR="flashlightWarm" />},
  {name: 'Корнеев', draw: (p) => <Korneev {...p} view="front" pose={{armL: [16, 6], armR: [16, 6]}} holdR="baton" />},
  {name: 'Павел', draw: (p) => <Pavel {...p} view="front" holdR="flashlight" />},
  {name: 'Пятнадцатый', draw: (p) => <CoatFigure {...p} view="front" />},
  {name: 'Ольга', draw: (p) => <Passenger {...p} type="olga" pose={{}} view="front" />},
  {name: 'Ахмед', draw: (p) => <Passenger {...p} type="akhmed" pose={{}} view="front" />},
  {name: 'Засв. A', draw: (p) => <Blind {...p} kind="A" seed="blind-3" />},
  {name: 'Засв. B', draw: (p) => <Blind {...p} kind="B" seed="blind-7" />},
  {name: 'Засв. C', draw: (p) => <Blind {...p} kind="C" seed="blind-12" walkT={0.2} />},
];

const Label: React.FC<{x: number; y: number; t: string; size?: number}> = ({x, y, t, size = 18}) => (
  <text x={x} y={y} fontFamily={FONT_MONO} fontSize={size} fill="#8D8F8A" textAnchor="middle">
    {t}
  </text>
);

const HeightRow: React.FC<{y: number; s: number; x0: number; dx: number; light?: Light; grid?: boolean; lod?: LOD}> = ({
  y,
  s,
  x0,
  dx,
  light = 'warm',
  grid = true,
  lod = 1,
}) => {
  const cm = (1000 / 180) * s; // пикселей на см
  return (
    <g>
      {grid
        ? Array.from({length: 21}).map((_, i) => (
            <g key={i}>
              <line x1={x0 - dx / 2} x2={x0 + dx * (CAST.length - 0.5)} y1={y - i * 10 * cm} y2={y - i * 10 * cm} stroke="#2c3a37" strokeWidth={i % 5 === 0 ? 1.5 : 0.7} />
              {i % 5 === 0 ? (
                <text x={x0 - dx / 2 - 6} y={y - i * 10 * cm + 5} fontFamily={FONT_MONO} fontSize={13} fill="#4c5a57" textAnchor="end">
                  {i * 10}
                </text>
              ) : null}
            </g>
          ))
        : null}
      {CAST.map((c, i) => (
        <g key={c.name}>
          {c.draw({x: x0 + i * dx, y, scale: s, light, lod})}
          <Label x={x0 + i * dx} y={y + 30} t={c.name} size={Math.max(12, 18 * s * 2)} />
        </g>
      ))}
    </g>
  );
};

export const CharacterSheet: React.FC<{section?: SheetSection}> = ({section = 'all'}) => {
  const views = ['front', 'three_quarter', 'profile', 'back'] as const;
  const lights: Light[] = ['warm', 'emergency', 'flashlight', 'silhouette'];
  return (
    <AbsoluteFill style={{background: '#16201E'}}>
      <svg width={1920} height={1080} viewBox="0 0 1920 1080">
        {section === 'all' ? (
          <g>
            <HeightRow y={470} s={0.36} x0={150} dx={160} />
            {/* ракурсы Глеба */}
            {views.map((v, i) => (
              <g key={v}>
                <Gleb x={110 + i * 135} y={980} scale={0.22} view={v} lod={2} pose={GLEB_POSES.stand_idle} />
                <Label x={110 + i * 135} y={1005} t={v} size={13} />
              </g>
            ))}
            {/* эволюция Глеба */}
            {([1, 2, 3, 4, 5] as const).map((ep, i) => (
              <g key={ep}>
                <Gleb x={690 + i * 115} y={980} scale={0.22} view="front" lod={2} episode={ep} pocketDosimeter={ep >= 2} pose={GLEB_POSES.stand_idle} />
                <Label x={690 + i * 115} y={1005} t={`С${ep}`} size={13} />
              </g>
            ))}
            {/* световые режимы Нины */}
            {lights.map((l, i) => (
              <g key={l}>
                <rect x={1265 + i * 160 - 75} y={560} width={150} height={450} fill={l === 'warm' ? '#3a3328' : l === 'flashlight' ? '#202628' : '#07090A'} />
                <Nina x={1265 + i * 160} y={980} scale={0.26} view="three_quarter" light={l} lod={2} pose={NINA_POSES.stand_idle} holdR="dosimeterNina" />
                <Label x={1265 + i * 160} y={1005} t={l} size={13} />
              </g>
            ))}
          </g>
        ) : null}
        {section === 'heights' ? <HeightRow y={1000} s={0.42} x0={130} dx={165} lod={1} /> : null}
        {section === 'silhouettes' ? (
          <g>
            <rect width={1920} height={1080} fill="#9a9f99" />
            <HeightRow y={1000} s={0.42} x0={130} dx={165} light="silhouette" grid={false} />
          </g>
        ) : null}
        {section === 'gleb'
          ? views.map((v, i) => <Gleb key={v} x={260 + i * 460} y={1040} scale={0.95} view={v} lod={2} pose={GLEB_POSES.stand_idle} />)
          : null}
        {section === 'evolution'
          ? ([1, 2, 3, 4, 5] as const).map((ep, i) => (
              <g key={ep} transform={`translate(${200 + i * 380},0)`}>
                <Gleb x={0} y={1900} scale={1.85} view="three_quarter" lod={2} episode={ep} pocketDosimeter={ep >= 2} pose={GLEB_POSES.stand_idle} />
              </g>
            ))
          : null}
        {section === 'blind'
          ? (['A', 'B', 'C'] as const).map((kd, i) => (
              <Blind key={kd} x={330 + i * 620} y={1040} scale={0.95} kind={kd} seed={`blind-${i * 5 + 3}`} lod={2} walkT={0.3} />
            ))
          : null}
        {section === 'coat' ? (
          <g>
            <CoatFigure x={350} y={1040} scale={0.9} view="front" lod={2} />
            <CoatFigure x={960} y={1900} scale={1.7} view="front" lod={2} headUp fingerToLips={1} />
            <CoatFigure x={1550} y={1040} scale={0.9} view="three_quarter" lod={2} headUp pose={{}} />
          </g>
        ) : null}
        {section === 'lights'
          ? lights.map((l, i) => (
              <g key={l}>
                <rect x={i * 480} y={0} width={480} height={1080} fill={l === 'warm' ? '#3a3328' : l === 'flashlight' ? '#202628' : '#07090A'} />
                <Nina x={240 + i * 480} y={1040} scale={1.0} view="three_quarter" light={l} lod={2} pose={NINA_POSES.stand_idle} holdR="dosimeterNina" />
              </g>
            ))
          : null}
      </svg>
    </AbsoluteFill>
  );
};
