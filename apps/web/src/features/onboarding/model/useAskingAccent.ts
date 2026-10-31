'use client';

// 배울 영어를 지금 물어야 하는가 — 묻는 게이트와, 그 아래 깔리지 않으려는 홈 안내가 같은 판정을 본다
import { shouldAskAccent } from './profile-gate';
import { useAccentQuery } from './useAccentQuery';

export const useAskingAccent = () => {
  const accentQuery = useAccentQuery();
  // 조회를 못 받았으면 undefined로 두어 묻지 않는다. 답하면 캐시에 심기는 즉시 닫힌다
  return shouldAskAccent(
    accentQuery.isSuccess ? accentQuery.data.accentLocale : undefined,
  );
};
