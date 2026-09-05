// 배울 영어(억양) 선택지 — 값은 BE 발음 에셋의 accentLocale enum(EN_US·EN_GB·EN_AU)을 그대로 쓴다.
// 서버에도 선택지 목록 API가 있지만 쓰지 않는다 — 국기 그림이 프론트 에셋이라
// 서버가 코드를 늘려도 그림 없이는 못 그리고, 결국 프론트 배포가 필요하다.
// 고른 값은 서버에만 남는다 (useSaveAccentMutation)
import type { AccentLocale } from '@landit/analytics';

export const ACCENTS: { locale: AccentLocale; label: string }[] = [
  { locale: 'EN_US', label: '미국 영어' },
  { locale: 'EN_GB', label: '영국 영어' },
  { locale: 'EN_AU', label: '호주 영어' },
];
