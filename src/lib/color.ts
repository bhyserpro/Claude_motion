// Небольшие цветовые утилиты: смешивание, затемнение, rgba.
type RGB = [number, number, number];

const cache = new Map<string, RGB>();

export const hexToRgb = (hex: string): RGB => {
  const hit = cache.get(hex);
  if (hit) return hit;
  let h = hex.replace('#', '');
  if (h.length === 3) h = h.split('').map((c) => c + c).join('');
  const v: RGB = [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)];
  cache.set(hex, v);
  return v;
};

const to2 = (n: number) => Math.max(0, Math.min(255, Math.round(n))).toString(16).padStart(2, '0');
export const rgbToHex = ([r, g, b]: RGB) => `#${to2(r)}${to2(g)}${to2(b)}`;

/** Линейное смешивание: t=0 → a, t=1 → b. */
export const mix = (a: string, b: string, t: number) => {
  if (t <= 0) return a;
  if (t >= 1) return b;
  const A = hexToRgb(a);
  const B = hexToRgb(b);
  return rgbToHex([A[0] + (B[0] - A[0]) * t, A[1] + (B[1] - A[1]) * t, A[2] + (B[2] - A[2]) * t]);
};

export const darken = (c: string, t: number) => mix(c, '#000000', t);
export const lighten = (c: string, t: number) => mix(c, '#ffffff', t);

export const rgba = (c: string, a: number) => {
  const [r, g, b] = hexToRgb(c);
  return `rgba(${r},${g},${b},${a})`;
};

/** Снижение насыщенности к серому той же яркости. */
export const desaturate = (c: string, t: number) => {
  const [r, g, b] = hexToRgb(c);
  const l = 0.3 * r + 0.59 * g + 0.11 * b;
  return rgbToHex([r + (l - r) * t, g + (l - g) * t, b + (l - b) * t]);
};

export const luminance = (c: string) => {
  const [r, g, b] = hexToRgb(c);
  return (0.3 * r + 0.59 * g + 0.11 * b) / 255;
};
