'use client';

// 기기 시간대가 한국 시각과 다른지 — 서버는 기기 시간대를 모르니 서버 HTML과 첫 렌더는 안내 없이 그리고, 붙은 뒤에 기기 값으로 바꾼다
import { useClientOnlyValue } from '@/shared/lib/useClientOnlyValue';

import { isOutsideKoreaTime } from './time-left';

export const useOutsideKoreaTime = () =>
  useClientOnlyValue(() => isOutsideKoreaTime(), false);
