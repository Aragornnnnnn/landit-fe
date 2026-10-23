'use client';

// 인라인 글자 크기 스크립트가 셸 주입보다 먼저 돌아 놓친 경우(Android의 늦은 주입)에 다시 판단한다
import { useEffect } from 'react';

import { applyInitialFontScale } from './font-scale';

export const FontScaleSync = () => {
  useEffect(applyInitialFontScale, []);
  return null;
};
