import React, {createContext, useContext} from 'react';
import {AbsoluteFill} from 'remotion';
import {DESIGN_SCALE, DH, DW, HEIGHT} from '../config';
import {Camera, CAM0} from '../lib/camera';
import {hexToRgb, luminance} from '../lib/color';

type StageCtx = {cam: Camera; fog: string; fogStart: number; fogEnd: number; id: string};
const Ctx = createContext<StageCtx>({cam: CAM0, fog: '#07090A', fogStart: 1, fogEnd: 8, id: 's'});
export const useStage = () => useContext(Ctx);

/**
 * Контейнер multiplane. Всё внутри рисуется в дизайн-координатах 1920×1080
 * и вписывается в кадр по ширине (для вертикали — по центру).
 * Тряска, крен и оптический зум применяются ко всему кадру сразу.
 */
export const Stage25D: React.FC<{
  cam?: Camera;
  fog?: string;
  fogStart?: number;
  fogEnd?: number;
  bg?: string;
  id?: string;
  children: React.ReactNode;
}> = ({cam = CAM0, fog = '#07090A', fogStart = 1, fogEnd = 8, bg = '#07090A', id = 'stage', children}) => {
  const offY = (HEIGHT - DH * DESIGN_SCALE) / 2;
  return (
    <AbsoluteFill style={{background: bg, overflow: 'hidden'}}>
      <div
        style={{
          position: 'absolute',
          left: 0,
          top: offY,
          width: DW,
          height: DH,
          transformOrigin: '0 0',
          transform: `scale(${DESIGN_SCALE})`,
        }}
      >
        <div
          style={{
            position: 'absolute',
            inset: 0,
            transformOrigin: `${DW / 2}px ${DH / 2}px`,
            transform: `translate(${cam.shakeX}px, ${cam.shakeY}px) rotate(${cam.roll}deg) scale(${cam.zoom})`,
          }}
        >
          <Ctx.Provider value={{cam, fog, fogStart, fogEnd, id}}>{children}</Ctx.Provider>
        </div>
      </div>
    </AbsoluteFill>
  );
};

/**
 * Плоскость на глубине z. Параллакс ∝ 1/z, наезд камеры (dolly) увеличивает ближние планы сильнее.
 * Туман — feColorMatrix (смешивание пикселей слоя с цветом тумана), размытие — статичное на слой.
 */
export const Layer: React.FC<{
  z: number;
  blur?: number;
  fog?: number; // переопределить авто-туман
  opacity?: number;
  children: React.ReactNode;
  style?: React.CSSProperties;
}> = ({z, blur = 0, fog, opacity = 1, children, style}) => {
  const {cam, fog: fogC, fogStart, fogEnd, id} = useStage();
  const d = Math.min(cam.dolly, z - 0.05);
  const depth = z - d;
  const s = z / depth;
  const tx = -cam.x / depth;
  const ty = -cam.y / depth;
  const f = fog ?? Math.max(0, Math.min(0.95, (depth - fogStart) / (fogEnd - fogStart)));
  const fid = `fog-${id}-${String(z).replace('.', '_')}`;
  const [r, g, b] = hexToRgb(fogC).map((v) => v / 255);
  const k = 1 - f;
  const filters: string[] = [];
  // тёмный туман ≈ затемнение: CSS brightness() в разы дешевле SVG-фильтра
  const darkFog = luminance(fogC) < 0.08;
  if (f > 0.001) filters.push(darkFog ? `brightness(${(1 - f).toFixed(3)})` : `url(#${fid})`);
  if (blur > 0) filters.push(`blur(${blur}px)`);
  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        transformOrigin: `${DW / 2}px ${DH / 2}px`,
        transform: `translate(${tx}px, ${ty}px) scale(${s})`,
        filter: filters.length ? filters.join(' ') : undefined,
        opacity,
        ...style,
      }}
    >
      {f > 0.001 && !darkFog ? (
        <svg width={0} height={0} style={{position: 'absolute'}}>
          <filter id={fid} colorInterpolationFilters="sRGB">
            <feColorMatrix
              type="matrix"
              values={`${k} 0 0 0 ${r * f}  0 ${k} 0 0 ${g * f}  0 0 ${k} 0 ${b * f}  0 0 0 1 0`}
            />
          </filter>
        </svg>
      ) : null}
      {children}
    </div>
  );
};

/** SVG-холст в дизайн-координатах, удобно класть внутрь Layer. */
export const DSvg: React.FC<{children: React.ReactNode; style?: React.CSSProperties; overflow?: boolean}> = ({
  children,
  style,
  overflow = true,
}) => (
  <svg
    width={DW}
    height={DH}
    viewBox={`0 0 ${DW} ${DH}`}
    style={{position: 'absolute', left: 0, top: 0, overflow: overflow ? 'visible' : 'hidden', ...style}}
  >
    {children}
  </svg>
);
