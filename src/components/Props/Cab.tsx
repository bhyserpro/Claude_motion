import React from 'react';
import {mix} from '../../lib/color';
import {FONT_MONO} from '../../lib/fonts';
import {setMapper, SetLight} from './MetroCar';

/**
 * Кабина машиниста.
 *  CabForwardFrame — изнутри на лобовое стекло: пульт, рукоять гудка; стекло — отверстие (за ним слой туннеля).
 *  CabSide — вид сбоку: кресло машиниста, пульт, боковое окно, дверь в салон.
 */
export const WINDSHIELD = {x: 300, y: 150, w: 1320, h: 470};

export const CabForwardFrame: React.FC<{light: SetLight; lamp?: number; strobe?: number; id: string; hornDown?: number; showHandle?: boolean}> = ({
  light,
  lamp = 1,
  strobe = 0,
  id,
  hornDown = 0,
  showHandle = true,
}) => {
  const c = setMapper(light, lamp);
  const w = WINDSHIELD;
  const red = (base: string) => (strobe > 0 ? mix(c(base), '#5a0d08', strobe * 0.6) : c(base));
  return (
    <svg width={1920} height={1080} viewBox="0 0 1920 1080" style={{position: 'absolute', left: 0, top: 0, overflow: 'visible'}}>
      {/* рама и стены кабины с проёмом лобового стекла */}
      <path
        d={`M-400,-300 H2320 V1380 H-400 Z M${w.x + 40},${w.y} L${w.x + w.w - 40},${w.y} Q${w.x + w.w},${w.y} ${w.x + w.w},${w.y + 50} L${w.x + w.w - 30},${w.y + w.h} L${w.x + 30},${w.y + w.h} L${w.x},${w.y + 50} Q${w.x},${w.y} ${w.x + 40},${w.y} Z`}
        fill={red('#2c312f')}
        fillRule="evenodd"
      />
      {/* стойка посередине */}
      <rect x={w.x + w.w / 2 - 14} y={w.y} width={28} height={w.h} fill={red('#232826')} />
      {/* щётка стеклоочистителя */}
      <rect x={w.x + 200} y={w.y + w.h - 30} width={380} height={8} rx={4} fill={red('#121413')} transform={`rotate(-14 ${w.x + 200} ${w.y + w.h - 30})`} />
      {/* пульт */}
      <path d={`M-400,${w.y + w.h + 30} L2320,${w.y + w.h + 30} L2320,1380 L-400,1380 Z`} fill={red('#262b29')} />
      <path d={`M-400,${w.y + w.h + 30} L2320,${w.y + w.h + 30} L2320,${w.y + w.h + 90} L-400,${w.y + w.h + 90} Z`} fill={red('#343a37')} />
      {/* приборы */}
      {[480, 640, 800].map((x, i) => (
        <g key={i}>
          <circle cx={x} cy={w.y + w.h + 170} r={56} fill={red('#121514')} />
          <circle cx={x} cy={w.y + w.h + 170} r={46} fill={red('#2b302d')} />
          <rect x={x - 3} y={w.y + w.h + 130} width={6} height={42} fill={red('#8a8a80')} transform={`rotate(${-40 + i * 30} ${x} ${w.y + w.h + 170})`} />
        </g>
      ))}
      {Array.from({length: 8}).map((_, i) => (
        <rect key={i} x={960 + i * 52} y={w.y + w.h + 130} width={34} height={22} rx={4} fill={red(i === 2 ? '#5a1a16' : '#1a1d1c')} />
      ))}
      <text x={1000} y={w.y + w.h + 210} fontFamily={FONT_MONO} fontSize={20} fill={red('#5a605c')}>
        ТЯГА · ТОРМОЗ · ГУДОК
      </text>
      {/* рукоять гудка */}
      {showHandle ? (
        <g transform={`translate(1480,${w.y + w.h + 150}) rotate(${-8 + hornDown * 16})`}>
          <rect x={-14} y={-150} width={28} height={170} rx={10} fill={red('#4a4f4c')} />
          <rect x={-40} y={-196} width={80} height={60} rx={22} fill={red('#121312')} />
          <rect x={-30} y={-190} width={22} height={40} rx={10} fill={red('#2a2c2b')} />
        </g>
      ) : null}
    </svg>
  );
};

/** Вид кабины сбоку (для сцен с Семёном, с Глебом и Пятнадцатым). */
export const CAB_FLOOR = 880;
export const CabSide: React.FC<{light: SetLight; lamp?: number; id: string; windowContent?: React.ReactNode; strobe?: number}> = ({
  light,
  lamp = 1,
  windowContent,
  strobe = 0,
}) => {
  const c = setMapper(light, lamp);
  const red = (base: string) => (strobe > 0 ? mix(c(base), '#5a0d08', strobe * 0.6) : c(base));
  return (
    <svg width={1920} height={1080} viewBox="0 0 1920 1080" style={{position: 'absolute', left: 0, top: 0, overflow: 'visible'}}>
      <rect x={-600} y={-400} width={3120} height={1900} fill={red('#2c312f')} />
      {/* потолок */}
      <rect x={-600} y={-400} width={3120} height={520} fill={red('#262b29')} />
      <rect x={300} y={100} width={700} height={18} fill={red('#4a4a44')} />
      {/* боковое окно */}
      <rect x={560} y={230} width={620} height={300} rx={30} fill={red('#070909')} />
      {windowContent}
      <rect x={560} y={230} width={620} height={300} rx={30} fill="none" stroke={red('#1a1d1c')} strokeWidth={18} />
      {/* дверь в салон слева */}
      <rect x={-60} y={160} width={360} height={CAB_FLOOR - 160} fill={red('#3b403d')} />
      <rect x={40} y={230} width={160} height={200} rx={10} fill={red('#0d1010')} />
      <rect x={250} y={520} width={22} height={70} rx={8} fill={red('#5a5e5a')} />
      {/* пульт справа */}
      <path d={`M1450,${CAB_FLOOR} L1450,520 L1700,470 L2400,470 L2400,${CAB_FLOOR} Z`} fill={red('#262b29')} />
      <path d={`M1450,520 L1700,470 L2400,470 L2400,500 L1700,500 L1460,548 Z`} fill={red('#3b403d')} />
      {/* кресло машиниста */}
      <rect x={1060} y={620} width={340} height={70} rx={20} fill={red('#2a2422')} />
      <rect x={1330} y={380} width={70} height={300} rx={22} fill={red('#2a2422')} />
      <rect x={1210} y={690} width={30} height={CAB_FLOOR - 690} fill={red('#1a1d1c')} />
      {/* пол */}
      <rect x={-600} y={CAB_FLOOR} width={3120} height={600} fill={red('#1d211f')} />
      <rect x={-600} y={CAB_FLOOR} width={3120} height={12} fill={red('#121514')} />
    </svg>
  );
};
