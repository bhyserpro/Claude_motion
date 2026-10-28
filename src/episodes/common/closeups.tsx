import React from 'react';
import {AbsoluteFill, interpolate, random, useCurrentFrame} from 'remotion';
import {Watch} from '../../components/Props/Watch';
import {PhoneScreen} from '../../components/Props/Phone';
import {Dosimeter} from '../../components/Props/Dosimeter';
import {LongHand} from '../../components/Characters/parts';
import {LIGHT_FN, Light} from '../../components/Characters/Rig';
import {FONT_HAND} from '../../lib/fonts';
import {fbm1, noise1} from '../../lib/noise';
import {mix} from '../../lib/color';

const svgStyle: React.CSSProperties = {position: 'absolute', left: 0, top: 0, overflow: 'visible'};

/** Размытые огни/формы на фоне крупного плана. */
export const Bokeh: React.FC<{seed: string; color: string; n?: number; a?: number; drift?: number; frame: number}> = ({seed, color, n = 9, a = 0.35, drift = 0, frame}) => (
  <svg width={1920} height={1080} style={{...svgStyle, filter: 'blur(28px)'}}>
    {Array.from({length: n}).map((_, i) => (
      <circle
        key={i}
        cx={random(`${seed}x${i}`) * 1920 + drift * frame}
        cy={random(`${seed}y${i}`) * 700 + 120}
        r={60 + random(`${seed}r${i}`) * 140}
        fill={color}
        opacity={a * (0.4 + random(`${seed}a${i}`) * 0.6)}
      />
    ))}
  </svg>
);

/**
 * Часы Глеба крупно: предплечье слева, циферблат в центре. t — секунды от начала минуты (дробные).
 * Секундная стрелка «тикает» дискретно, с маленьким отскоком.
 */
export const WatchShot: React.FC<{h: number; m: number; s: number; light?: 'warm' | 'emergency' | 'dark'; shake?: number; zoom?: number; tick?: boolean; dy?: number}> = ({
  h,
  m,
  s,
  light = 'warm',
  shake = 0,
  zoom = 1,
  tick = true,
  dy: offY = 0,
}) => {
  const frame = useCurrentFrame();
  const sec = tick ? Math.floor(s) + Math.min(1, (s % 1) * 8) * 1 - (s % 1 < 0.125 ? 0 : 0) : s;
  const secShown = tick ? Math.floor(s) + (s % 1 < 0.06 ? -0.08 * Math.sin(((s % 1) / 0.06) * Math.PI) : 0) : sec;
  const L = (c: string) => (light === 'warm' ? c : light === 'emergency' ? LIGHT_FN.emergency(c) : LIGHT_FN.dark(c));
  const dx = fbm1('wx', frame / 50, 2) * 6 + noise1('wsx', frame / 1.5) * shake;
  const dy = fbm1('wy', frame / 60, 2) * 5 + noise1('wsy', frame / 1.3) * shake;
  return (
    <AbsoluteFill style={{background: light === 'warm' ? '#2a241c' : light === 'emergency' ? '#1a0504' : '#050606'}}>
      <Bokeh seed="wb" color={light === 'warm' ? '#e8d3a0' : '#B3261E'} frame={frame} drift={0.15} a={light === 'dark' ? 0.05 : 0.3} />
      <svg width={1920} height={1080} style={svgStyle}>
        <g transform={`translate(${960 + dx},${540 + dy + offY}) scale(${zoom}) translate(-960,-540)`}>
          {/* рукав пальто и манжета */}
          <path d="M-200,380 L700,420 Q760,520 700,640 L-200,700 Z" fill={L('#4A4E43')} />
          <path d="M-200,600 L700,620 Q740,630 700,640 L-200,700 Z" fill={L('#353930')} />
          <path d="M640,415 L760,430 Q800,525 760,628 L640,640 Q680,530 640,415 Z" fill={L('#9EA3A0')} />
          {/* кисть */}
          <path d="M740,440 L1250,460 Q1420,470 1480,540 Q1440,610 1260,620 L740,625 Z" fill={L('#B8A996')} />
          <path d="M740,560 L1260,575 Q1420,590 1480,540 Q1440,610 1260,620 L740,625 Z" fill={L('#8E7F6E')} />
          <path d="M1250,470 Q1330,420 1410,450 L1430,470 Q1350,480 1280,500 Z" fill={L('#a89986')} />
          {/* ремешок */}
          <rect x={890} y={420} width={150} height={230} rx={14} fill={L('#1A1A1A')} />
          <Watch x={965} y={535} r={150} h={h} m={m} s={secShown} tint={light === 'emergency' ? '#3a0806' : '#000'} tintA={light === 'warm' ? 0 : light === 'emergency' ? 0.45 : 0.75} />
        </g>
      </svg>
    </AbsoluteFill>
  );
};

/** Несколько телефонов в руках в темноте, у всех застыло 18:47. */
export const PhonesShot: React.FC<{light?: 'emergency' | 'dark'}> = ({light = 'emergency'}) => {
  const frame = useCurrentFrame();
  const phones = [
    {x: 520, y: 560, w: 170, r: -8, d: 0},
    {x: 960, y: 500, w: 200, r: 4, d: 25},
    {x: 1400, y: 590, w: 160, r: 11, d: 50},
    {x: 760, y: 820, w: 120, r: -18, d: 70},
    {x: 1180, y: 300, w: 110, r: 16, d: 90},
  ];
  const skin = light === 'emergency' ? LIGHT_FN.emergency('#B8A996') : LIGHT_FN.dark('#B8A996');
  return (
    <AbsoluteFill style={{background: '#060404'}}>
      <svg width={1920} height={1080} style={svgStyle}>
        {phones.map((p, i) => {
          const on = frame > p.d;
          const sway = fbm1(`ph${i}`, frame / 40, 2) * 6;
          return (
            <g key={i} transform={`translate(${sway},${sway * 0.6})`}>
              <ellipse cx={p.x} cy={p.y} rx={p.w * 1.5} ry={p.w * 1.8} fill="#9fb8c8" opacity={on ? 0.08 : 0} />
              <g transform={`translate(${p.x},${p.y + p.w * 0.95}) rotate(${p.r})`}>
                <path d={`M${-p.w * 0.75},0 Q${-p.w * 0.8},${p.w * 0.9} ${-p.w * 0.2},${p.w * 1.6} L${p.w * 0.4},${p.w * 1.6} Q${p.w * 0.8},${p.w * 0.9} ${p.w * 0.7},0 Z`} fill={skin} />
              </g>
              {on ? <PhoneScreen x={p.x} y={p.y} w={p.w} rotate={p.r} cracked={i === 1} /> : <PhoneScreen x={p.x} y={p.y} w={p.w} rotate={p.r} glow={0} />}
            </g>
          );
        })}
      </svg>
    </AbsoluteFill>
  );
};

/** Дозиметр в ладони крупно. value — строка; led — щелчок. */
export const DosimeterShot: React.FC<{
  value: string;
  unit?: string;
  led: boolean;
  variant?: 'nina' | 'pavel';
  light?: 'emergency' | 'dark' | 'flashlight' | 'warm';
  shake?: number;
  hand?: string;
  warn?: boolean;
  bg?: React.ReactNode;
  scale?: number;
}> = ({value, unit, led, variant = 'nina', light = 'emergency', shake = 0, hand = '#C2B2A0', warn, bg, scale = 1.25}) => {
  const frame = useCurrentFrame();
  const L = (c: string) => (light === 'warm' ? c : LIGHT_FN[light as Light](c));
  const dx = fbm1('dx', frame / 40, 2) * 5 + noise1('dsx', frame / 1.2) * shake;
  const dy = fbm1('dy', frame / 47, 2) * 4 + noise1('dsy', frame / 1.1) * shake;
  return (
    <AbsoluteFill style={{background: light === 'emergency' ? '#120303' : '#040505'}}>
      {bg}
      <svg width={1920} height={1080} style={svgStyle}>
        <g transform={`translate(${dx},${dy})`}>
          {/* ЖК подсвечивает пальцы */}
          <ellipse cx={960} cy={420} rx={420} ry={300} fill="#B9C64A" opacity={0.03} />
          {/* ладонь снизу, большой палец слева, пальцы обхватывают правый край */}
          <path d="M640,1250 Q600,900 720,780 L1200,780 Q1330,900 1290,1250 Z" fill={L(hand)} />
          <path d="M1060,790 L1200,780 Q1330,900 1290,1250 L1150,1250 Z" fill={L(mix(hand, '#000', 0.22))} />
          <Dosimeter x={960} y={560} scale={scale} variant={variant} value={value} unit={unit} led={led} light={light === 'warm' ? 'warm' : light} warn={warn} />
          {[0, 1, 2, 3].map((i) => (
            <rect key={i} x={1112 - i * 6} y={560 + i * 78} width={110} height={62} rx={30} fill={L(mix(hand, '#000', 0.08 + i * 0.04))} />
          ))}
          <path d="M700,840 Q650,760 700,640 Q740,600 790,640 L820,760 Q800,840 760,880 Z" fill={L(mix(hand, '#000', 0.05))} />
        </g>
      </svg>
    </AbsoluteFill>
  );
};

/**
 * Окно вагона крупно: запотевшее стекло, тьма туннеля за ним.
 * text — проступающая надпись (прогресс 0..1, потёки drip 0..1).
 */
export const FogWindowShot: React.FC<{
  text?: string;
  progress?: number;
  drip?: number;
  fog?: number;
  light?: 'dark' | 'emergency' | 'flashlight';
  beamX?: number;
  children?: React.ReactNode;
}> = ({text = 'НЕ СЧИТАЙ', progress = 0, drip = 0, fog = 1, light = 'flashlight', beamX = 0.5, children}) => {
  const frame = useCurrentFrame();
  const glassFog = light === 'emergency' ? '#3a1210' : '#7f8c8e';
  const letters = text.split('');
  return (
    <AbsoluteFill style={{background: '#030404'}}>
      <svg width={1920} height={1080} style={svgStyle}>
        <defs>
          <radialGradient id="fw-beam" cx={beamX} cy="0.5" r="0.6">
            <stop offset="0%" stopColor={glassFog} stopOpacity={0.55 * fog} />
            <stop offset="70%" stopColor={glassFog} stopOpacity={0.22 * fog} />
            <stop offset="100%" stopColor={glassFog} stopOpacity={0.05 * fog} />
          </radialGradient>
        </defs>
        {children}
        {/* запотевание */}
        <rect x={-100} y={-100} width={2120} height={1280} fill="url(#fw-beam)" />
        {Array.from({length: 140}).map((_, i) => (
          <circle key={i} cx={random(`fg${i}`) * 1920} cy={random(`fgy${i}`) * 1080} r={1 + random(`fgr${i}`) * 3} fill="#c9d4d6" opacity={0.15 * fog} />
        ))}
        {/* рама окна */}
        <path d="M-200,-200 H2120 V1280 H-200 Z M140,150 Q140,110 180,110 H1740 Q1780,110 1780,150 V930 Q1780,970 1740,970 H180 Q140,970 140,930 Z" fill="#141716" fillRule="evenodd" />
        {/* надпись проступает со стороны туннеля: буквы — стёртый конденсат */}
        <g opacity={progress > 0 ? 1 : 0}>
          {letters.map((ch, i) => {
            const p = interpolate(progress, [i / letters.length, (i + 1) / letters.length], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
            if (p <= 0) return null;
            const x = 380 + i * 128;
            return (
              <g key={i}>
                <text
                  x={x}
                  y={600}
                  fontFamily={FONT_HAND}
                  fontWeight={600}
                  fontSize={230}
                  fill="#050606"
                  opacity={0.85 * p}
                  style={{clipPath: `inset(0 ${(1 - p) * 100}% 0 0)`}}
                >
                  {ch}
                </text>
                {ch !== ' ' && drip > 0
                  ? [0, 1].map((k) => {
                      const L = drip * (80 + random(`dr${i}${k}`) * 240);
                      const dx = 20 + random(`drx${i}${k}`) * 60;
                      return (
                        <rect key={k} x={x + dx} y={590} width={7} height={L} rx={3.5} fill="#050606" opacity={0.75 * p} />
                      );
                    })
                  : null}
              </g>
            );
          })}
        </g>
        {/* блик стекла */}
        <path d="M300,140 L520,140 L260,960 L120,960 Z" fill="#fff" opacity={0.035} />
      </svg>
      <AbsoluteFill style={{opacity: 0.12 + noise1('fwf', frame / 20) * 0.02, background: 'transparent'}} />
    </AbsoluteFill>
  );
};

/** Пальцы/ладонь: удобный экспорт для крупных планов. */
export {LongHand};

/** Руки ладонями вверх в луче фонаря. Кончики пальцев тёмные (сорваны ногти). */
export const HandsShot: React.FC<{torn?: boolean; zoom?: number; skin?: string; beamX?: number; beamY?: number; pants?: string}> = ({
  torn = true,
  zoom = 1,
  skin = '#ABA394',
  beamX = 960,
  beamY = 560,
  pants = '#1A2230',
}) => {
  const frame = useCurrentFrame();
  const L = (c: string) => LIGHT_FN.flashlight(c);
  const dx = fbm1('hsx', frame / 50, 2) * 6;
  const hand = (x: number, y: number, rot: number, flip: number) => (
    <g transform={`translate(${x},${y}) rotate(${rot}) scale(${flip},1)`}>
      <rect x={-130} y={-40} width={260} height={300} rx={110} fill={L(skin)} />
      <rect x={-60} y={-10} width={150} height={190} rx={70} fill={L('#857e72')} opacity={0.35} />
      {[-95, -35, 25, 85].map((fx, i) => (
        <g key={i} transform={`translate(${fx},230)`}>
          <rect x={-24} y={0} width={48} height={170 - Math.abs(i - 1.5) * 20} rx={24} fill={L(skin)} />
          {torn ? <rect x={-22} y={120 - Math.abs(i - 1.5) * 20} width={44} height={46} rx={18} fill="#3A1A16" /> : null}
          {torn && i % 2 === 0 ? <rect x={-6} y={160 - Math.abs(i - 1.5) * 20} width={10} height={40} rx={5} fill="#4a1410" /> : null}
        </g>
      ))}
      <g transform="translate(-150,60) rotate(40)">
        <rect x={-26} y={0} width={52} height={150} rx={26} fill={L(skin)} />
        {torn ? <rect x={-24} y={110} width={48} height={40} rx={18} fill="#3A1A16" /> : null}
      </g>
    </g>
  );
  return (
    <AbsoluteFill style={{background: '#030404'}}>
      <svg width={1920} height={1080} style={svgStyle}>
        <g transform={`translate(${960 + dx},540) scale(${zoom}) translate(-960,-540)`}>
          <rect x={-200} y={-200} width={2400} height={1500} fill={L(pants)} />
          <path d="M-200,700 Q960,560 2200,700 L2200,1300 L-200,1300 Z" fill={L('#151D29')} opacity={0.6} />
          {hand(720, 300, -8, 1)}
          {hand(1200, 310, 8, -1)}
        </g>
      </svg>
      <svg width={1920} height={1080} style={svgStyle}>
        <defs>
          <radialGradient id="hs-b">
            <stop offset="0%" stopColor="#000" stopOpacity={0} />
            <stop offset="55%" stopColor="#000" stopOpacity={0.25} />
            <stop offset="100%" stopColor="#000" stopOpacity={0.96} />
          </radialGradient>
        </defs>
        <rect x={-500} y={-500} width={2920} height={2080} fill="#000" opacity={0.96} mask="url(#hs-mask)" />
        <mask id="hs-mask">
          <rect x={-500} y={-500} width={2920} height={2080} fill="#fff" />
          <ellipse cx={beamX} cy={beamY} rx={620} ry={420} fill="url(#hs-bm)" />
        </mask>
        <radialGradient id="hs-bm">
          <stop offset="0%" stopColor="#000" />
          <stop offset="60%" stopColor="#000" stopOpacity={0.8} />
          <stop offset="100%" stopColor="#000" stopOpacity={0} />
        </radialGradient>
      </svg>
    </AbsoluteFill>
  );
};

/** Карман пальто Глеба крупно: рука опускает в него жёлтый дозиметр Павла. progress 0..1. */
export const PocketShot: React.FC<{progress: number; light?: 'flashlight' | 'dark' | 'emergency'}> = ({progress, light = 'flashlight'}) => {
  const frame = useCurrentFrame();
  const L = (c: string) => LIGHT_FN[light](c);
  const p = interpolate(progress, [0, 1], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const dy = interpolate(p, [0, 0.7, 1], [-380, 40, 60]);
  const handA = interpolate(p, [0.75, 1], [1, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const sway = fbm1('pk', frame / 40, 2) * 5;
  return (
    <AbsoluteFill style={{background: '#030404'}}>
      <svg width={1920} height={1080} style={svgStyle}>
        <g transform={`translate(${sway},0)`}>
          {/* пальто */}
          <rect x={-200} y={-200} width={2400} height={1500} fill={L('#4A4E43')} />
          <path d="M1250,-200 L1500,1300 L2200,1300 L2200,-200 Z" fill={L('#353930')} />
          {Array.from({length: 40}).map((_, i) => (
            <circle key={i} cx={random(`pka${i}`) * 1920} cy={random(`pkb${i}`) * 1080} r={1.5 + random(`pkc${i}`) * 3} fill={L('#8D8F8A')} opacity={0.5} />
          ))}
          {/* прорезь кармана с клапаном */}
          <rect x={560} y={520} width={760} height={34} fill={L('#1d201b')} />
          {/* дозиметр уходит в карман: видна часть выше прорези */}
          <g>
            <defs>
              <clipPath id="pk-clip">
                <rect x={-200} y={-500} width={2400} height={1060} />
              </clipPath>
            </defs>
            <g clipPath="url(#pk-clip)">
              <g transform={`translate(860,${300 + dy}) rotate(-6)`}>
                <rect x={0} y={0} width={190} height={270} rx={30} fill={L('#A88A2E')} />
                <rect x={30} y={40} width={130} height={74} fill="#B9C64A" opacity={0.85} />
                <g opacity={handA}>
                  <path d="M-60,120 Q-90,40 -20,-10 L230,-30 Q300,40 260,140 Z" fill={L('#B8A996')} />
                  {[0, 1, 2, 3].map((i) => (
                    <rect key={i} x={-40 + i * 66} y={-70} width={56} height={110} rx={28} fill={L('#a89986')} />
                  ))}
                </g>
              </g>
            </g>
          </g>
          <path d="M540,500 L1340,500 L1330,580 L550,580 Z" fill={L('#353930')} opacity={p > 0.7 ? 0.9 : 0.6} />
          <path d="M540,500 L1340,500 L1338,512 L542,512 Z" fill={L('#2A2C27')} />
          {p > 0.85 ? <path d="M880,512 L1060,512 L1050,560 L890,560 Z" fill={L('#A88A2E')} opacity={0.9} /> : null}
        </g>
      </svg>
    </AbsoluteFill>
  );
};
