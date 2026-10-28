import React from 'react';
import {interpolate} from 'remotion';
import {FONT_HAND, FONT_MONO} from '../../lib/fonts';

/** Строки списка Нины (имена, «доза», ✓). Последняя строка спрятана под загибом до серии 3, 2:20. */
export const NINA_LIST: {name: string; dose: string; check?: boolean}[] = [
  {name: 'Корнеев', dose: '1,9'},
  {name: 'Ольга', dose: '1,4'},
  {name: 'Ахмед', dose: '1,1'},
  {name: 'Семён Арк.', dose: '4,7', check: true},
  {name: 'муж. в спецовке', dose: '2,2'},
  {name: 'студентка', dose: '0,9'},
  {name: 'дед с тростью', dose: '3,8'},
  {name: 'жен. в пуховике', dose: '1,6'},
  {name: 'муж. с портфелем', dose: '2,0'},
  {name: 'подросток', dose: '0,7'},
  {name: 'жен. в пальто', dose: '1,2'},
  {name: 'Сомов Г.', dose: '6,2 Зв'},
];

/**
 * Блокнот в клетку со списком. Рисуется внутри <svg> в координатах кадра.
 * fold 0..1 — загнут нижний край (1 — последние строки скрыты), checksUntil — сколько галочек видно.
 */
export const NinaNotebook: React.FC<{
  x: number;
  y: number;
  scale?: number;
  rotate?: number;
  fold?: number;
  frame?: number;
  highlightLast?: number; // 0..1
  light?: 'flashlight' | 'emergency' | 'warm';
}> = ({x, y, scale = 1, rotate = 0, fold = 1, highlightLast = 0, light = 'flashlight'}) => {
  const W = 760;
  const H = 1000;
  const rowH = 66;
  const top = 150;
  const foldH = fold * 190;
  const paper = '#D8D2C2';
  const ink = '#2a2f45';
  return (
    <g transform={`translate(${x},${y}) rotate(${rotate}) scale(${scale})`}>
      <rect x={-W / 2 + 14} y={-H / 2 + 18} width={W} height={H} fill="#000" opacity={0.5} />
      <rect x={-W / 2} y={-H / 2} width={W} height={H} fill={paper} />
      {/* клетка */}
      {Array.from({length: 38}).map((_, i) => (
        <line key={`v${i}`} x1={-W / 2 + i * 20} y1={-H / 2} x2={-W / 2 + i * 20} y2={H / 2} stroke="#8aa0b4" strokeOpacity={0.3} strokeWidth={1} />
      ))}
      {Array.from({length: 50}).map((_, i) => (
        <line key={`h${i}`} x1={-W / 2} y1={-H / 2 + i * 20} x2={W / 2} y2={-H / 2 + i * 20} stroke="#8aa0b4" strokeOpacity={0.3} strokeWidth={1} />
      ))}
      {/* пружина */}
      {Array.from({length: 18}).map((_, i) => (
        <circle key={`r${i}`} cx={-W / 2 + 30 + i * 40} cy={-H / 2 + 14} r={9} fill="#1a1a1a" />
      ))}
      <text x={-W / 2 + 50} y={-H / 2 + 100} fontFamily={FONT_MONO} fontSize={22} fill={ink} opacity={0.7}>
        ФИО
      </text>
      <text x={W * 0.12} y={-H / 2 + 100} fontFamily={FONT_MONO} fontSize={22} fill={ink} opacity={0.7}>
        доза
      </text>
      <text x={W * 0.36} y={-H / 2 + 100} fontFamily={FONT_MONO} fontSize={22} fill={ink} opacity={0.7}>
        ✓
      </text>
      <line x1={-W / 2 + 40} y1={-H / 2 + 115} x2={W / 2 - 40} y2={-H / 2 + 115} stroke={ink} strokeWidth={2} opacity={0.6} />
      {NINA_LIST.map((r, i) => {
        const ry = -H / 2 + top + 40 + i * rowH;
        const last = i === NINA_LIST.length - 1;
        return (
          <g key={i}>
            <text x={-W / 2 + 50} y={ry} fontFamily={FONT_HAND} fontSize={44} fill={ink}>
              {r.name}
            </text>
            <text x={W * 0.12} y={ry} fontFamily={FONT_HAND} fontSize={44} fill={last ? '#5a1210' : ink}>
              {r.dose}
            </text>
            {r.check ? (
              <text x={W * 0.36} y={ry} fontFamily={FONT_HAND} fontSize={52} fill={ink}>
                ✓
              </text>
            ) : null}
            {last && highlightLast > 0 ? (
              <rect x={-W / 2 + 40} y={ry - 44} width={W - 80} height={58} fill="#7A1712" opacity={0.12 * highlightLast} />
            ) : null}
          </g>
        );
      })}
      {/* загиб нижнего края */}
      {foldH > 1 ? (
        <g>
          <rect x={-W / 2} y={H / 2 - foldH} width={W} height={foldH} fill="#bdb6a6" />
          <rect x={-W / 2} y={H / 2 - foldH} width={W} height={10} fill="#000" opacity={0.25} />
          {Array.from({length: Math.floor(foldH / 20)}).map((_, i) => (
            <line key={i} x1={-W / 2} y1={H / 2 - foldH + 10 + i * 20} x2={W / 2} y2={H / 2 - foldH + 10 + i * 20} stroke="#8aa0b4" strokeOpacity={0.22} />
          ))}
        </g>
      ) : null}
      {light === 'emergency' ? <rect x={-W / 2} y={-H / 2} width={W} height={H} fill="#4a0805" opacity={0.45} style={{mixBlendMode: 'multiply'}} /> : null}
    </g>
  );
};

export const foldAt = (frame: number, a: number, b: number) =>
  interpolate(frame, [a, b], [1, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
