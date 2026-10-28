import React, {useLayoutEffect, useRef} from 'react';
import {DH, DW} from '../../config';
import {hexToRgb} from '../../lib/color';

export type Beam = {
  sx: number; // источник
  sy: number;
  tx: number; // центр пятна
  ty: number;
  r: number; // радиус пятна
  intensity?: number; // 0..1
  stretch?: number; // вытянутость пятна вдоль луча
  color?: string;
};

const PAD = 800;
const RES = 0.5; // тьма считается в половинном разрешении — края всё равно мягкие

/**
 * Всё в темноте, видно только в конусе фонаря. Рисуется внутри Stage (дизайн-координаты).
 * Тьма рисуется на canvas: заливка, затем «вырезаются» пятна и конусы (destination-out).
 * darkness — непрозрачность тьмы вне луча.
 */
export const FlashlightMask: React.FC<{beams: Beam[]; darkness?: number; id: string; color?: string; haze?: number}> = ({
  beams,
  darkness = 0.97,
  color = '#030404',
  haze = 0.12,
}) => {
  const ref = useRef<HTMLCanvasElement>(null);
  const W = Math.round((DW + PAD * 2) * RES);
  const H = Math.round((DH + PAD * 2) * RES);
  const key = JSON.stringify([beams, darkness, color, haze]);
  useLayoutEffect(() => {
    const cv = ref.current;
    if (!cv) return;
    const ctx = cv.getContext('2d');
    if (!ctx) return;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, W, H);
    ctx.globalCompositeOperation = 'source-over';
    const [r, g, b] = hexToRgb(color);
    ctx.fillStyle = `rgba(${r},${g},${b},${darkness})`;
    ctx.fillRect(0, 0, W, H);
    ctx.setTransform(RES, 0, 0, RES, PAD * RES, PAD * RES);
    ctx.globalCompositeOperation = 'destination-out';
    for (const bm of beams) {
      const k = bm.intensity ?? 1;
      if (k <= 0.001) continue;
      const dx = bm.tx - bm.sx;
      const dy = bm.ty - bm.sy;
      const len = Math.max(1, Math.hypot(dx, dy));
      const nx = -dy / len;
      const ny = dx / len;
      const w0 = bm.r * 0.08;
      const w1 = bm.r * 0.85;
      // конус: слабая дымка вдоль луча
      ctx.globalAlpha = haze * k;
      ctx.beginPath();
      ctx.moveTo(bm.sx + nx * w0, bm.sy + ny * w0);
      ctx.lineTo(bm.tx + nx * w1, bm.ty + ny * w1);
      ctx.lineTo(bm.tx - nx * w1, bm.ty - ny * w1);
      ctx.lineTo(bm.sx - nx * w0, bm.sy - ny * w0);
      ctx.closePath();
      ctx.fillStyle = '#000';
      ctx.fill();
      // пятно: вытянутый эллипс с мягким краем
      ctx.globalAlpha = k;
      ctx.save();
      ctx.translate(bm.tx, bm.ty);
      ctx.rotate(Math.atan2(dy, dx));
      ctx.scale(bm.stretch ?? 1.25, 1);
      const grad = ctx.createRadialGradient(0, 0, 0, 0, 0, bm.r);
      grad.addColorStop(0, 'rgba(0,0,0,1)');
      grad.addColorStop(0.45, 'rgba(0,0,0,0.92)');
      grad.addColorStop(0.75, 'rgba(0,0,0,0.45)');
      grad.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(0, 0, bm.r, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
    ctx.globalAlpha = 1;
    // холодный отсвет в пятне
    ctx.globalCompositeOperation = 'source-over';
    for (const bm of beams) {
      const k = bm.intensity ?? 1;
      if (k <= 0.001) continue;
      const [cr, cg, cb] = hexToRgb(bm.color ?? '#D9E4E8');
      const grad = ctx.createRadialGradient(bm.tx, bm.ty, 0, bm.tx, bm.ty, bm.r * 1.1);
      grad.addColorStop(0, `rgba(${cr},${cg},${cb},${0.1 * k})`);
      grad.addColorStop(1, `rgba(${cr},${cg},${cb},0)`);
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(bm.tx, bm.ty, bm.r * 1.1, 0, Math.PI * 2);
      ctx.fill();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, W, H]);
  return (
    <canvas
      ref={ref}
      width={W}
      height={H}
      style={{position: 'absolute', left: -PAD, top: -PAD, width: DW + PAD * 2, height: DH + PAD * 2, pointerEvents: 'none'}}
    />
  );
};
