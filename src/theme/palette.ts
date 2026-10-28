export const PALETTE = {
  // Тьма туннеля
  dark0: '#07090A',
  dark1: '#0E1413',
  dark2: '#16201E',
  // Бетон / металл
  concrete: '#2A302E',
  metal: '#3B4240',
  // Аварийный свет
  emergency: '#7A1712',
  emergencyGlow: '#B3261E',
  // Фонарь (холодный)
  flashlight: '#D9E4E8',
  // Дозиметр, ЖК
  lcd: '#B9C64A',
  // Пепел
  ash: '#8D8F8A',
  // Кожа засвеченных
  blindSkin: '#C9C2B4',
  blindSkin2: '#E3DDD2',
  burn: '#5B2A22',
  burn2: '#3E1E19',
  // Акт осмотра
  paper: '#CFC6B2',
  pencil: '#3A3A3A',
  // Тёплые лампы вагона (до катастрофы)
  lamp: '#E8D3A0',
  lampHot: '#F4E6C2',
  // Кровь
  blood: '#7A1712',
  // Щебень
  gravel1: '#5E605C',
  gravel2: '#7A7C77',
  gravel3: '#46484A',
} as const;

export type PaletteKey = keyof typeof PALETTE;
