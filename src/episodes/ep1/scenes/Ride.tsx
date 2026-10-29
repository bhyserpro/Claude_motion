import React from 'react';
import {AbsoluteFill, interpolate, useCurrentFrame} from 'remotion';
import {DSvg, Stage25D} from '../../../components/Stage25D';
import {ContractClause, Monologue, Timestamp} from '../../../components/Text';
import {useWordFrame} from '../../../components/Voice';
import {camKeys, handheld} from '../../../lib/camera';
import {Snd} from '../../common/audio';
import {CarSideLayers} from '../../common/sets';
import {EP1_SIDE} from '../cast';
import {Gleb} from '../../../components/Characters/Gleb';

/** Пункт 9.4 — сквозной мотив: в договоре заранее записано, что с ними случится. */
export const CLAUSES_9 = [
  {num: '9.3', text: 'Не является страховым случаем ущерб вследствие военных действий, маневров и иных военных мероприятий.'},
  {num: '9.4', text: 'Не является страховым случаем ущерб вследствие воздействия ядерного взрыва, радиации или радиоактивного заражения.'},
  {num: '9.5', text: 'Не возмещается ущерб, причинённый умышленными действиями Страхователя.'},
];

/** Вагон сбоку, тёплый свет, медленный наезд на Глеба. Монолог E1-02, затем пункт 9.4 (E1-N01). */
export const Ep1Ride: React.FC<{dur: number}> = ({dur}) => {
  const frame = useCurrentFrame();
  const fire = useWordFrame('E1-02', 'Пожар', 120);
  const clause = useWordFrame('E1-N01', 'Пункт', 320);
  const fine = useWordFrame('E1-N01', 'Мелкий', 540);
  const cam = handheld(
    camKeys(frame, [
      {f: 0, x: -60, dolly: 0, zoom: 1},
      {f: clause, x: 120, dolly: 0.18, zoom: 1.01},
      {f: dur, x: 260, dolly: 0.36, zoom: 1.03},
    ]),
    frame,
    3,
    'ride',
  );
  // «неправильная» деталь: в тёмном стекле на 18 кадров отражается лишняя бледная голова
  const ghostAt = clause + 150;
  const ghost = frame > ghostAt && frame < ghostAt + 18 ? 1 : 0;
  return (
    <AbsoluteFill>
      <Stage25D cam={cam} fogEnd={10}>
        <CarSideLayers
          frame={frame}
          id="ride"
          light="warm"
          motion={1}
          actors={EP1_SIDE}
          glass={(w, i) =>
            i === 9 && ghost ? <ellipse cx={w.x + w.w * 0.6} cy={w.y + w.h * 0.45} rx={26} ry={30} fill="#cfc9bc" opacity={0.18} /> : null
          }
          mid={[]}
          midOverlay={
            <DSvg>
              <rect x={-600} y={238} width={3200} height={12} rx={6} fill="#a8a294" />
              {[700, 1000, 1340, 1650].map((x) => (
                <path key={x} d={`M${x},250 l-14,70 a20,20 0 1,0 28,0 Z`} fill="#2a2a28" />
              ))}
              <Gleb x={1230} y={1000} scale={0.64} view="three_quarter" lod={2} frame={frame} pose={{armL: [4, 8], armR: [168, 6], handR: 'fist', headPitch: 0.25}} />
            </DSvg>
          }
        />
      </Stage25D>
      <ContractClause start={clause - 4} end={clause + 75} section="9. Исключения из страхового покрытия" clauses={CLAUSES_9} mark="9.4" markAt={clause + 8} />
      <Timestamp text="ДЕНЬ 0 — 18:39" start={0} end={dur} />
      <Monologue voice="E1-02" start={30} end={fire} lines={['Двадцать лет я оцениваю убытки.']} />
      <Monologue voice="E1-02" start={fire} end={clause - 2} lines={['Пожар, потоп, авария. Я прихожу после.', 'Считаю, что осталось.']} />
      <Monologue voice="E1-N01" start={clause} end={fine} lines={['Пункт 9.4. Не является страховым случаем ущерб', 'вследствие… радиоактивного заражения.']} />
      <Monologue voice="E1-N01" start={fine} end={dur - 4} lines={['Мелкий шрифт. Его никто не читает.']} />
      <Snd src="hit.wav" dur={60} vol={0.8} />
      <Snd src="noise_cut.wav" from={clause - 4} dur={10} vol={0.12} />
      <Snd src="rails_loop.wav" dur={dur} vol={0.7} loop />
      <Snd src="tunnel_drone.wav" dur={dur} vol={(f) => 0.3 + interpolate(f, [0, dur], [0, 0.05])} loop />
    </AbsoluteFill>
  );
};
