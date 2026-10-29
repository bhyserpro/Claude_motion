import React from 'react';
import {AbsoluteFill, interpolate, Sequence, useCurrentFrame} from 'remotion';
import {FilmGrain, Letterbox, Vignette} from '../../components/FX';
import {Timestamp} from '../../components/Text';
import {FONT_MONO} from '../../lib/fonts';
import {UI} from '../../config';
import {Snd} from './audio';
import {VoiceLine, VoiceProvider} from '../../components/Voice';

/** Общая «плёнка» серии: зерно, виньетка, летербокс (отключаемый для актов), озвучка из voice.json. */
export const Film: React.FC<{
  children: React.ReactNode;
  noLetterbox?: [number, number][];
  grain?: number;
  vignette?: number;
  voice?: VoiceLine[];
}> = ({
  children,
  noLetterbox = [],
  voice = [],
  grain = 0.16,
  vignette = 0.75,
}) => {
  const frame = useCurrentFrame();
  const paper = noLetterbox.some(([a, b]) => frame >= a && frame < b);
  return (
    <AbsoluteFill style={{background: '#000'}}>
      <VoiceProvider lines={voice}>{children}</VoiceProvider>
      {vignette > 0 && !paper ? <Vignette strength={vignette} /> : null}
      <FilmGrain opacity={paper ? grain * 0.6 : grain} />
      {!paper ? <Letterbox /> : null}
    </AbsoluteFill>
  );
};

/** Сцена = Sequence с именем; внутри useCurrentFrame() отсчитывается от начала сцены. */
export const Shot: React.FC<{from: number; dur: number; name: string; children: React.ReactNode}> = ({from, dur, name, children}) => (
  <Sequence from={from} durationInFrames={dur} name={name}>
    {children}
  </Sequence>
);

/**
 * Блок «РАНЕЕ»: 3 вставки по 2 секунды, шумные склейки. Не длиннее 6 секунд.
 */
export const Recap: React.FC<{parts: React.ReactNode[]}> = ({parts}) => {
  const frame = useCurrentFrame();
  const each = 60;
  const idx = Math.min(parts.length - 1, Math.floor(frame / each));
  const local = frame - idx * each;
  const noise = local < 4 || local > each - 3;
  return (
    <AbsoluteFill style={{background: '#000'}}>
      <Sequence from={idx * each} durationInFrames={each} layout="none">
        <AbsoluteFill style={{opacity: noise ? 0.35 : 1}}>{parts[idx]}</AbsoluteFill>
      </Sequence>
      {noise ? <FilmGrain opacity={0.9} seed={idx * 13 + local} /> : null}
      <div
        style={{
          position: 'absolute',
          right: 70 * UI,
          top: 52 * UI,
          fontFamily: FONT_MONO,
          fontSize: 24 * UI,
          letterSpacing: 6 * UI,
          color: '#A9ADA6',
          opacity: 0.75,
          zIndex: 10,
        }}
      >
        РАНЕЕ
      </div>
      {parts.map((_, i) => (
        <Snd key={i} src="noise_cut.wav" from={i * each} dur={14} vol={0.5} />
      ))}
    </AbsoluteFill>
  );
};

/**
 * Пауза-переход в FullFilm на месте вырезанного «РАНЕЕ»: чёрный кадр, таймкод, звук.
 */
export const ChapterGap: React.FC<{dur: number; stamp: string; suffix?: string; bed?: string}> = ({dur, stamp, suffix, bed = 'tunnel_drone.wav'}) => {
  const frame = useCurrentFrame();
  const a = interpolate(frame, [20, 40, dur - 20, dur], [0, 1, 1, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  return (
    <AbsoluteFill style={{background: '#000'}}>
      <Timestamp text={stamp} suffix={suffix} start={20} end={dur} suffixEnd={dur + 60} />
      <Snd src={bed} dur={dur} vol={0.55} fadeIn={20} fadeOut={20} loop />
    </AbsoluteFill>
  );
};

/** Чёрный кадр. */
export const Black: React.FC = () => <AbsoluteFill style={{background: '#000'}} />;

export {Film as EpisodeFilm};
