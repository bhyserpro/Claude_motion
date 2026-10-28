import React from 'react';
import {AbsoluteFill, random, useCurrentFrame} from 'remotion';
import {Layer, Stage25D, DSvg} from '../../components/Stage25D';
import {Tunnel} from '../../components/Props/Tunnel';
import {CabForwardFrame} from '../../components/Props/Cab';
import {Blind} from '../../components/Characters/Blind';
import {TUN} from '../../components/Props/Tunnel';
import {LIGHT_FN} from '../../components/Characters/Rig';
import {Camera, CAM0} from '../../lib/camera';
import {makeProjector} from '../../lib/persp';
import {placeAt} from '../common/cast';

/** Красный строб: 0..1 по кадру. */
export const strobe = (frame: number, period = 14, duty = 5) => ((frame % period) < duty ? 1 : 0.15);

/**
 * Вид из кабины через лобовое стекло: туннель, в темноте — «засвеченные».
 * crowd: сколько их (0..1), approach — насколько близко подошли (0..1), walking — идут ли.
 */
export const Windshield: React.FC<{
  frame: number;
  cam?: Camera;
  crowd: number;
  approach: number;
  walk?: number; // скорость шага (циклов в кадр)
  strobeK?: number;
  eyesOnlyFar?: boolean;
  handle?: boolean;
  hornDown?: number;
  hand?: React.ReactNode;
}> = ({frame, cam = CAM0, crowd, approach, walk = 0, strobeK = 1, handle = true, hornDown = 0, hand}) => {
  const pcam = {x: 0, y: -0.25, z: 0, f: 820, cy: 420};
  const pr = makeProjector(pcam);
  const n = Math.round(30 * crowd);
  const people = Array.from({length: n}).map((_, i) => {
    const row = Math.floor(i / 6);
    const x = -1.6 + (i % 6) * 0.64 + (random(`ws${i}`) - 0.5) * 0.3;
    const z0 = 7 + row * 3.2 + random(`wz${i}`) * 1.5;
    const z = Math.max(2.2, z0 - approach * 5.5);
    return {x, z, seed: `ws-b${i}`, t: (frame * walk + random(`wt${i}`)) % 1};
  });
  const lit = strobeK * 0.5;
  return (
    <Stage25D cam={cam} bg="#030202">
      <Layer z={1}>
        <Tunnel id="wsh" pcam={pcam} light="dark" glowTint="#B3261E" glowA={lit} items={[]} />
        <DSvg>
          {people
            .sort((a, b) => b.z - a.z)
            .map((p) => {
              const q = placeAt(pr, p.x, TUN.FLOOR, p.z, 2, 30);
              return (
                <g key={p.seed}>
                  <Blind x={q.x} y={q.y} scale={q.scale} seed={p.seed} kind={walk > 0 ? 'C' : 'B'} view="front" walkT={p.t} light={strobeK > 0.6 ? 'emergency' : 'dark'} fog={Math.min(0.92, q.fog + 0.35)} fogColor="#050101" lod={1} />
                  <Blind x={q.x} y={q.y} scale={q.scale} seed={p.seed} kind={walk > 0 ? 'C' : 'B'} view="front" walkT={p.t} eyesOnly lod={1} />
                </g>
              );
            })}
        </DSvg>
      </Layer>
      <Layer z={1}>
        <CabForwardFrame light="dark" strobe={strobeK} id="cff" showHandle={handle} hornDown={hornDown} />
        {hand}
      </Layer>
    </Stage25D>
  );
};

/** Рука Глеба на рукояти гудка (крупно, справа внизу). squeeze 0..1 */
export const HornHand: React.FC<{squeeze: number; strobeK: number; hornDown?: number}> = ({squeeze, strobeK, hornDown = 0}) => {
  const L = (c: string) => (strobeK > 0.6 ? LIGHT_FN.emergency(c) : LIGHT_FN.dark(c));
  return (
    <svg width={1920} height={1080} style={{position: 'absolute', left: 0, top: 0, overflow: 'visible'}}>
      <g transform={`translate(1480,${790 + hornDown * 20}) rotate(${-8 + hornDown * 16}) scale(1.6)`}>
        {/* рукав пальто снизу справа */}
        <path d="M60,40 L460,420 L620,420 L620,120 L180,-60 Z" fill={L('#4A4E43')} />
        {/* кисть обхватывает набалдашник */}
        <g transform={`translate(0,${-170})`}>
          <rect x={-70} y={-70} width={150} height={120} rx={50} fill={L('#9AA593')} />
          {[0, 1, 2, 3].map((i) => (
            <rect key={i} x={-64 + i * 34} y={-40 - squeeze * 8} width={30} height={92 - squeeze * 14} rx={15} fill={L(i % 2 ? '#8e9686' : '#a3ab9a')} />
          ))}
          {/* выпавшие волоски на пальцах */}
          <path d="M-50,-20 q12,20 4,44 M-14,-26 q-8,26 6,48 M22,-18 q10,22 -2,40" stroke={L('#2B2622')} strokeWidth={2} fill="none" />
          <rect x={60} y={-30} width={46} height={30} rx={14} fill={L('#9AA593')} transform="rotate(30 60 -30)" />
        </g>
      </g>
    </svg>
  );
};

export const BlackOut: React.FC = () => {
  useCurrentFrame();
  return <AbsoluteFill style={{background: '#000'}} />;
};
