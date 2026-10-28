import React from 'react';
import {Sequence} from 'remotion';

/** Показать сцену начиная с её кадра `at` (для блоков «РАНЕЕ» и вставок-воспоминаний). */
export const At: React.FC<{at: number; children: React.ReactNode}> = ({at, children}) => (
  <Sequence from={-at} layout="none">
    {children}
  </Sequence>
);
