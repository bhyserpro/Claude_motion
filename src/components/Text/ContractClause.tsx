import React from 'react';
import {AbsoluteFill, interpolate, useCurrentFrame} from 'remotion';
import {UI} from '../../config';
import {FONT_MONO, FONT_SERIF} from '../../lib/fonts';
import {noise1} from '../../lib/noise';

export type Clause = {num: string; text: string};

/**
 * Сквозной мотив Глеба: страница правил страхования проступает поверх кадра,
 * нужный пункт обводится карандашом. start/end — кадры появления и исчезновения (проступает и тает по 8 кадров).
 */
export const ContractClause: React.FC<{
  start: number;
  end: number;
  section: string;
  clauses: Clause[];
  mark: string; // номер пункта, который обводится
  markAt?: number; // кадр начала обводки (по умолчанию start + 10)
  x?: number; // центр листа, доля ширины
  rotate?: number;
}> = ({start, end, section, clauses, mark, markAt, x = 0.6, rotate = -2.5}) => {
  const frame = useCurrentFrame();
  if (frame < start || frame >= end) return null;
  const a = interpolate(frame, [start, start + 8, end - 8, end], [0, 1, 1, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const m0 = markAt ?? start + 10;
  const ring = interpolate(frame, [m0, m0 + 14], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const dx = noise1('ccx', frame / 70) * 6;
  const dy = noise1('ccy', frame / 80) * 5;
  const w = 820 * UI;
  const size = 25 * UI;
  return (
    <AbsoluteFill style={{pointerEvents: 'none', opacity: a, zIndex: 9}}>
      <AbsoluteFill style={{background: 'radial-gradient(ellipse at 60% 50%, rgba(0,0,0,0.25), rgba(0,0,0,0.6))'}} />
      <div
        style={{
          position: 'absolute',
          left: `${x * 100}%`,
          top: '50%',
          width: w,
          transform: `translate(calc(-50% + ${dx}px), calc(-50% + ${dy}px)) rotate(${rotate}deg) scale(${interpolate(frame, [start, end], [1, 1.04])})`,
          background: 'linear-gradient(180deg, #E4DDCB, #D6CDB7)',
          boxShadow: `0 ${18 * UI}px ${50 * UI}px rgba(0,0,0,0.6)`,
          padding: `${34 * UI}px ${44 * UI}px`,
          color: '#2A2620',
          fontFamily: FONT_SERIF,
          fontSize: size,
          lineHeight: 1.38,
        }}
      >
        <div style={{fontFamily: FONT_MONO, fontSize: 15 * UI, letterSpacing: 2 * UI, opacity: 0.7, marginBottom: 12 * UI}}>
          ПРАВИЛА СТРАХОВАНИЯ ИМУЩЕСТВА ФИЗИЧЕСКИХ ЛИЦ
        </div>
        <div style={{fontWeight: 700, fontSize: size * 0.95, marginBottom: 10 * UI}}>{section}</div>
        {clauses.map((c) => (
          <div key={c.num} style={{marginBottom: 8 * UI, opacity: c.num === mark ? 1 : 0.55}}>
            <span style={{position: 'relative', display: 'inline-block', fontWeight: 700, marginRight: 8 * UI}}>
              {c.num}.
              {c.num === mark ? (
                <svg
                  viewBox="0 0 100 50"
                  preserveAspectRatio="none"
                  style={{position: 'absolute', left: -14 * UI, top: -9 * UI, width: `calc(100% + ${28 * UI}px)`, height: `calc(100% + ${18 * UI}px)`, overflow: 'visible'}}
                >
                  {/* карандашный овал вокруг номера пункта — прорисовывается за 14 кадров, с нахлёстом в конце */}
                  <path
                    d="M10,34 C4,14 40,2 82,8 C100,12 100,40 72,46 C42,52 2,46 4,26 C5,16 18,8 34,6"
                    fill="none"
                    stroke="#6E6658"
                    strokeLinecap="round"
                    pathLength={1}
                    strokeDasharray={1}
                    strokeDashoffset={1 - ring}
                    vectorEffect="non-scaling-stroke"
                    style={{strokeWidth: 3 * UI}}
                  />
                </svg>
              ) : null}
            </span>
            {c.text}
          </div>
        ))}
      </div>
    </AbsoluteFill>
  );
};
