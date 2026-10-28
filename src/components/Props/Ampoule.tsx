import React from 'react';
import {FONT_SERIF} from '../../lib/fonts';

/** Коробка ампул морфина из больничного сейфа: белая с красной полосой. empty — сколько пустых. */
export const AmpouleBox: React.FC<{x: number; y: number; scale?: number; empty?: number; total?: number; open?: boolean}> = ({
  x,
  y,
  scale = 1,
  empty = 4,
  total = 10,
  open = true,
}) => {
  const W = 520;
  const H = 230;
  return (
    <g transform={`translate(${x},${y}) scale(${scale})`}>
      <rect x={-W / 2 + 10} y={-H / 2 + 12} width={W} height={H} fill="#000" opacity={0.5} />
      <rect x={-W / 2} y={-H / 2} width={W} height={H} fill="#E6E2DA" />
      <rect x={-W / 2} y={-H / 2} width={W} height={26} fill="#7A1712" />
      {open ? (
        <g>
          <rect x={-W / 2 + 16} y={-H / 2 + 40} width={W - 32} height={H - 56} fill="#cfcac0" />
          {Array.from({length: total}).map((_, i) => {
            const ax = -W / 2 + 40 + i * ((W - 80) / (total - 1));
            const isEmpty = i < empty;
            return (
              <g key={i} transform={`translate(${ax},${-H / 2 + 60})`}>
                <rect x={-11} y={0} width={22} height={isEmpty ? 92 : 130} rx={9} fill={isEmpty ? '#d9dfe2' : '#e8eef0'} opacity={isEmpty ? 0.55 : 0.95} />
                {!isEmpty ? <rect x={-6} y={0} width={12} height={40} rx={6} fill="#e8eef0" /> : <path d="M-11,92 l5,-8 l6,6 l5,-9 l6,11" stroke="#9aa4a8" strokeWidth={2} fill="none" />}
                {!isEmpty ? <rect x={-11} y={70} width={22} height={34} fill="#c9a24a" opacity={0.75} /> : null}
                {!isEmpty ? <rect x={-9} y={50} width={6} height={70} fill="#fff" opacity={0.5} /> : null}
              </g>
            );
          })}
        </g>
      ) : (
        <g>
          <text x={-W / 2 + 24} y={-H / 2 + 80} fontFamily={FONT_SERIF} fontSize={34} fill="#2a2724">
            Морфин 1% · 1 мл
          </text>
          <text x={-W / 2 + 24} y={-H / 2 + 120} fontFamily={FONT_SERIF} fontSize={22} fill="#4a4540">
            10 ампул · Для стационаров
          </text>
          <text x={-W / 2 + 24} y={-H / 2 + 190} fontFamily={FONT_SERIF} fontSize={20} fill="#7A1712">
            ГКБ № 4 · сейф отд. рентгенологии
          </text>
        </g>
      )}
    </g>
  );
};

/** Этикетка на крышке, отдельно (кладётся рядом с открытой коробкой). */
export const AmpouleLabel: React.FC<{x: number; y: number; scale?: number; rotate?: number}> = ({x, y, scale = 1, rotate = 0}) => (
  <g transform={`translate(${x},${y}) rotate(${rotate}) scale(${scale})`}>
    <rect x={0} y={0} width={420} height={150} fill="#E6E2DA" />
    <rect x={0} y={0} width={420} height={20} fill="#7A1712" />
    <text x={20} y={66} fontFamily={FONT_SERIF} fontSize={32} fill="#2a2724">
      Морфин 1% · 1 мл
    </text>
    <text x={20} y={100} fontFamily={FONT_SERIF} fontSize={19} fill="#4a4540">
      Для стационаров · строгий учёт
    </text>
    <text x={20} y={132} fontFamily={FONT_SERIF} fontSize={18} fill="#7A1712">
      ГКБ № 4 · отд. рентгенологии
    </text>
  </g>
);
