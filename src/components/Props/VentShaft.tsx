import React from 'react';
import {random} from 'remotion';
import {setMapper, SetLight} from './MetroCar';
import {Dust} from '../FX/Dust';

/**
 * Камера вентшахты ВШ-12 (вид сбоку, для Stage25D). Отдельные слои:
 *  ShaftBack — дальняя стена, лестница вверх в темноту, серый свет далеко наверху;
 *  ShaftPiles — горы одежды, обуви и десятки дозиметров на полу;
 *  ShaftAsh — пепел, падающий как снег.
 */
export const SHAFT_FLOOR = 900;

export const ShaftBack: React.FC<{light: SetLight; skyA?: number; id: string}> = ({light, skyA = 1, id}) => {
  const c = setMapper(light);
  return (
    <svg width={1920} height={1080} viewBox="0 0 1920 1080" style={{position: 'absolute', left: 0, top: 0, overflow: 'visible'}}>
      <defs>
        <linearGradient id={`${id}-sky`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#8f938f" stopOpacity={0.9 * skyA} />
          <stop offset="100%" stopColor="#8f938f" stopOpacity={0} />
        </linearGradient>
      </defs>
      <rect x={-800} y={-1200} width={3520} height={3000} fill={c('#1d2220')} />
      {/* ствол шахты: вертикальная щель вверх */}
      <rect x={760} y={-1200} width={400} height={2100} fill={c('#141817')} />
      {/* серый свет далеко наверху: решётка открыта */}
      <rect x={830} y={-1200} width={260} height={1100} fill={`url(#${id}-sky)`} />
      <rect x={846} y={-1200} width={228} height={30} fill="#9a9e9a" opacity={0.5 * skyA} />
      {/* кольца крепи */}
      {Array.from({length: 18}).map((_, i) => (
        <rect key={i} x={752} y={-1150 + i * 110} width={416} height={10} fill={c('#2a302d')} />
      ))}
      {/* лестница */}
      <rect x={905} y={-1200} width={10} height={2100} fill={c('#4a4e4a')} />
      <rect x={1005} y={-1200} width={10} height={2100} fill={c('#4a4e4a')} />
      {Array.from({length: 48}).map((_, i) => (
        <rect key={i} x={905} y={-1180 + i * 44} width={110} height={7} fill={c('#5a5e5a')} />
      ))}
      {/* стены камеры: бетон с потёками */}
      {Array.from({length: 26}).map((_, i) => {
        const x = -700 + random(`${id}-st${i}`) * 3300;
        if (x > 740 && x < 1180) return null;
        return <rect key={`s${i}`} x={x} y={-200 + random(`${id}-sy${i}`) * 500} width={6 + random(`${id}-sw${i}`) * 20} height={300 + random(`${id}-sh${i}`) * 700} fill={c('#161a19')} opacity={0.6} />;
      })}
      <rect x={-800} y={SHAFT_FLOOR} width={3520} height={600} fill={c('#121514')} />
    </svg>
  );
};

/** Горы одежды, обуви, дозиметров. */
export const ShaftPiles: React.FC<{light: SetLight; id: string; x?: number; w?: number}> = ({light, id, x = 600, w = 760}) => {
  const c = setMapper(light);
  const items: React.ReactNode[] = [];
  const cols = ['#3e3a44', '#4a4e43', '#5a4f48', '#2f3436', '#6B4A4A', '#4E4A52', '#5c5753', '#3a3f48'];
  for (let i = 0; i < 70; i++) {
    const px = x + random(`${id}-px${i}`) * w;
    const h = Math.sin(((px - x) / w) * Math.PI) * 120;
    const py = SHAFT_FLOOR - random(`${id}-py${i}`) * h;
    const r = 30 + random(`${id}-pr${i}`) * 50;
    const rot = random(`${id}-rot${i}`) * 180;
    items.push(<ellipse key={`c${i}`} cx={px} cy={py} rx={r} ry={r * 0.45} fill={c(cols[i % cols.length])} transform={`rotate(${rot * 0.2 - 18} ${px} ${py})`} />);
  }
  for (let i = 0; i < 24; i++) {
    const px = x + random(`${id}-sx${i}`) * w;
    const py = SHAFT_FLOOR - random(`${id}-sy${i}`) * 60 - 10;
    items.push(<path key={`sh${i}`} d={`M${px},${py} q20,-24 50,-12 l10,14 l-62,0 Z`} fill={c(i % 3 ? '#1c1a18' : '#c9c6be')} />);
  }
  // десятки дозиметров
  for (let i = 0; i < 34; i++) {
    const px = x - 60 + random(`${id}-dx${i}`) * (w + 120);
    const py = SHAFT_FLOOR - random(`${id}-dy${i}`) * 70 - 4;
    const rot = (random(`${id}-dr${i}`) - 0.5) * 70;
    const yellow = random(`${id}-dc${i}`) < 0.35;
    items.push(
      <g key={`d${i}`} transform={`translate(${px},${py}) rotate(${rot})`}>
        <rect x={-12} y={-17} width={24} height={34} rx={4} fill={c(yellow ? '#A88A2E' : '#2C2F2C')} />
        <rect x={-8} y={-12} width={16} height={9} fill={c('#5a6230')} />
      </g>,
    );
  }
  return (
    <svg width={1920} height={1080} viewBox="0 0 1920 1080" style={{position: 'absolute', left: 0, top: 0, overflow: 'visible'}}>
      {items}
    </svg>
  );
};

/** Пепел, падающий из ствола шахты. */
export const ShaftAsh: React.FC<{seed: string; count?: number; x?: number; w?: number; opacity?: number; frameOffset?: number}> = ({
  seed,
  count = 160,
  x = 520,
  w = 900,
  opacity = 0.85,
  frameOffset = 0,
}) => (
  <svg width={1920} height={1080} viewBox="0 0 1920 1080" style={{position: 'absolute', left: 0, top: 0, overflow: 'visible'}}>
    <Dust seed={seed} count={count} x={x} y={-200} w={w} h={1200} color="#a3a59f" size={[1.5, 4]} fall={1.6} drift={0.8} opacity={opacity} flakes frameOffset={frameOffset} />
  </svg>
);
