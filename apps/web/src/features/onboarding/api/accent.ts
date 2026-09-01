// 배울 영어(억양) 조회·저장 — 백엔드 UserAccentLocaleResponse·UserAccentLocaleUpdateRequest 미러.
// 선택지 목록(GET /api/v1/accent-locales)은 쓰지 않는다 — 국기 그림이 프론트 에셋이라
// 서버가 코드를 늘려도 그림 없이는 못 그리고, 결국 프론트 배포가 필요하다
import type { AccentLocale } from '@landit/analytics';

import { api } from '@/shared/api/client';

export interface UserAccentLocaleResponse {
  // 아직 안 고른 사용자는 null이 온다 — 게이트가 물을지 말지를 이 값으로 가른다.
  // 스웨거에는 nullable로 안 적혀 있지만 백엔드에 확인한 실제 동작이 이렇다
  accentLocale: AccentLocale | null;
  // 서버가 부르는 나라 이름("미국") — 화면 라벨("미국 영어")과 달라 지금은 쓰지 않는다
  name: string | null;
}

export const getMyAccentLocale = () =>
  api.get<UserAccentLocaleResponse>('/api/v1/me/accent-locale');

/** 반복 호출하면 마지막 값으로 덮어쓴다 */
export const updateAccentLocale = (accentLocale: AccentLocale) =>
  api.put<null>('/api/v1/me/accent-locale', { accentLocale });
