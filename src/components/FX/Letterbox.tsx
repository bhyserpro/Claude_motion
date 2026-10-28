import React from 'react';
import {AbsoluteFill} from 'remotion';
import {BAR_H} from '../../config';

/** Полосы 2.39:1. */
export const Letterbox: React.FC<{opacity?: number}> = ({opacity = 1}) =>
  BAR_H <= 0 ? null : (
    <AbsoluteFill style={{pointerEvents: 'none', opacity, zIndex: 5}}>
      <div style={{position: 'absolute', left: 0, right: 0, top: 0, height: BAR_H, background: '#000'}} />
      <div style={{position: 'absolute', left: 0, right: 0, bottom: 0, height: BAR_H, background: '#000'}} />
    </AbsoluteFill>
  );
