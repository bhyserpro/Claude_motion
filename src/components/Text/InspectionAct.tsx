import React from 'react';
import {AbsoluteFill, interpolate, random, useCurrentFrame} from 'remotion';
import {HEIGHT, UI, WIDTH} from '../../config';
import {FONT_HAND, FONT_SERIF} from '../../lib/fonts';
import {noise1} from '../../lib/noise';
import {PALETTE} from '../../theme/palette';

export type ActLine = {
  /** Одна или несколько строк рукописи (каждая — своя линейка). */
  text: string | string[];
  at: number;
  /** Кадров на символ (скорость письма). */
  speed?: number;
  strike?: number; // кадр, когда пункт зачёркивается
  underline?: boolean;
  num?: string;
};

export type ActField = {label: string; value: string; at: number};

const writeLen = (s: string, speed: number) => Math.max(6, Math.round(s.length * speed));

const Handwritten: React.FC<{text: string; at: number; speed: number; frame: number; size: number; color: string}> = ({
  text,
  at,
  speed,
  frame,
  size,
  color,
}) => {
  const p = interpolate(frame, [at, at + writeLen(text, speed)], [0, 100], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  if (p <= 0) return null;
  return (
    <span
      style={{
        fontFamily: FONT_HAND,
        fontSize: size,
        color,
        whiteSpace: 'pre',
        display: 'inline-block',
        clipPath: `inset(-30% ${100 - p}% -30% -2%)`,
        transform: `rotate(${(random(`hw-${text}`) - 0.5) * 0.8}deg)`,
      }}
    >
      {text}
    </span>
  );
};

/**
 * Полноэкранный бланк «АКТ ОСМОТРА № N». Пункты прописываются карандашом по одному.
 * Бумага освещена фонарём: края уходят в темноту.
 */
export const InspectionAct: React.FC<{
  number: string;
  fields?: ActField[];
  items: ActLine[];
  light?: number; // 0..1 — насколько освещён лист
  beamX?: number; // центр пятна света (доля ширины)
  beamY?: number;
  driftSeed?: string;
  red?: boolean; // аварийный свет вместо фонаря
}> = ({number, fields = [], items, light = 1, beamX = 0.45, beamY = 0.45, driftSeed = 'act', red = false}) => {
  const frame = useCurrentFrame();
  const sx = noise1(`${driftSeed}x`, frame / 90) * 10;
  const sy = noise1(`${driftSeed}y`, frame / 110) * 8;
  const zoom = 1.02 + frame * 0.00004;
  const pencil = PALETTE.pencil;
  const lineH = 74 * UI;
  const hand = 50 * UI;
  const left = WIDTH * 0.16;
  const top = HEIGHT * 0.33;

  // волокна бумаги — детерминированно
  const fibers: React.ReactNode[] = [];
  for (let i = 0; i < 90; i++) {
    const x = random(`fib-x${i}`) * WIDTH;
    const y = random(`fib-y${i}`) * HEIGHT;
    const l = 8 + random(`fib-l${i}`) * 26;
    const a = random(`fib-a${i}`) * 180;
    fibers.push(
      <line key={i} x1={x} y1={y} x2={x + Math.cos(a) * l} y2={y + Math.sin(a) * l} stroke="#7d7462" strokeOpacity={0.18} strokeWidth={1} />,
    );
  }

  let row = 0;
  return (
    <AbsoluteFill style={{background: '#050505', overflow: 'hidden'}}>
      <AbsoluteFill style={{transform: `translate(${sx}px, ${sy}px) scale(${zoom}) rotate(-0.6deg)`}}>
        <AbsoluteFill style={{background: PALETTE.paper}}>
          <svg width={WIDTH} height={HEIGHT} style={{position: 'absolute'}}>
            {fibers}
            {/* поля и линейки бланка */}
            <line x1={WIDTH * 0.12} y1={0} x2={WIDTH * 0.12} y2={HEIGHT} stroke="#9a5a4e" strokeOpacity={0.35} strokeWidth={2} />
            {Array.from({length: 12}).map((_, i) => (
              <line
                key={i}
                x1={WIDTH * 0.12}
                x2={WIDTH * 0.93}
                y1={top + lineH * (i + 1) - 10 * UI}
                y2={top + lineH * (i + 1) - 10 * UI}
                stroke="#6f7a86"
                strokeOpacity={0.28}
                strokeWidth={1.4}
              />
            ))}
            {/* сгиб листа */}
            <line x1={0} y1={HEIGHT * 0.52} x2={WIDTH} y2={HEIGHT * 0.5} stroke="#fff" strokeOpacity={0.12} strokeWidth={3} />
            <line x1={0} y1={HEIGHT * 0.52 + 3} x2={WIDTH} y2={HEIGHT * 0.5 + 3} stroke="#000" strokeOpacity={0.08} strokeWidth={3} />
          </svg>
          <div
            style={{
              position: 'absolute',
              left,
              top: HEIGHT * 0.09,
              fontFamily: FONT_SERIF,
              color: '#2e2b26',
            }}
          >
            <div style={{fontSize: 22 * UI, letterSpacing: 4 * UI, opacity: 0.75}}>ФОРМА 7-УБ · ОЦЕНКА УЩЕРБА</div>
            <div style={{fontSize: 58 * UI, fontWeight: 700, letterSpacing: 6 * UI, marginTop: 8 * UI}}>
              АКТ ОСМОТРА № <Handwritten text={number} at={-999} speed={1} frame={frame} size={66 * UI} color={pencil} />
            </div>
          </div>
          <div style={{position: 'absolute', left, top: HEIGHT * 0.22, fontFamily: FONT_SERIF, color: '#3a362f', fontSize: 24 * UI}}>
            {fields.map((fl, i) => (
              <div key={i} style={{height: 48 * UI, display: 'flex', alignItems: 'baseline', gap: 16 * UI}}>
                <span style={{opacity: 0.8}}>{fl.label}</span>
                <Handwritten text={fl.value} at={fl.at} speed={1.4} frame={frame} size={42 * UI} color={pencil} />
              </div>
            ))}
          </div>
          <div style={{position: 'absolute', left, top: top + (fields.length > 2 ? 40 * UI : 0)}}>
            {items.map((it, i) => {
              const lines = Array.isArray(it.text) ? it.text : [it.text];
              const speed = it.speed ?? 1.5;
              let t = it.at;
              const els = lines.map((ln, j) => {
                const myAt = t;
                t += writeLen(ln, speed) + 3;
                const r = row++;
                return (
                  <div key={j} style={{position: 'absolute', top: r * lineH - hand * 0.62, left: j === 0 ? 0 : 52 * UI, whiteSpace: 'nowrap'}}>
                    {j === 0 ? (
                      <Handwritten text={`${it.num ?? i + 1}.  `} at={myAt - 4} speed={2} frame={frame} size={hand} color={pencil} />
                    ) : null}
                    <Handwritten text={ln} at={myAt} speed={speed} frame={frame} size={hand} color={pencil} />
                    {it.underline && frame > t ? (
                      <div style={{position: 'absolute', left: 52 * UI, right: 0, bottom: 6 * UI, height: 2.5 * UI, background: pencil, opacity: 0.8}} />
                    ) : null}
                  </div>
                );
              });
              const strikeP =
                it.strike !== undefined
                  ? interpolate(frame, [it.strike, it.strike + 10], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'})
                  : 0;
              return (
                <React.Fragment key={i}>
                  {els}
                  {strikeP > 0 ? (
                    <div
                      style={{
                        position: 'absolute',
                        top: (row - lines.length) * lineH + 2 * UI,
                        left: 0,
                        width: WIDTH * 0.66 * strikeP,
                        height: 3 * UI,
                        background: pencil,
                        transform: 'rotate(-0.8deg)',
                      }}
                    />
                  ) : null}
                </React.Fragment>
              );
            })}
          </div>
        </AbsoluteFill>
      </AbsoluteFill>
      {/* свет: фонарь (холодный) или аварийный красный */}
      <AbsoluteFill
        style={{
          background: red
            ? `radial-gradient(ellipse 70% 80% at ${beamX * 100}% ${beamY * 100}%, rgba(122,23,18,0.18) 0%, rgba(40,6,4,${0.55 + 0.4 * (1 - light)}) 70%, rgba(5,2,2,0.95) 100%)`
            : `radial-gradient(ellipse 62% 75% at ${beamX * 100}% ${beamY * 100}%, rgba(217,228,232,0.10) 0%, rgba(0,0,0,${0.1 + 0.6 * (1 - light)}) 45%, rgba(0,0,0,${0.72 + 0.25 * (1 - light)}) 85%, rgba(0,0,0,0.96) 100%)`,
          mixBlendMode: 'multiply',
        }}
      />
    </AbsoluteFill>
  );
};
