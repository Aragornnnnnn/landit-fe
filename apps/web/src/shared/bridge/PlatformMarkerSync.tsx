'use client';

// 인라인 플랫폼 표시가 놓친 경우(셸 주입이 늦은 로드, 전역 에러 복구로 <html>이 새로 그려진 뒤)에 다시 찍는다
import { useEffect } from 'react';

import { markNativePlatform } from './platform-marker';

export const PlatformMarkerSync = () => {
  useEffect(markNativePlatform, []);
  return null;
};
