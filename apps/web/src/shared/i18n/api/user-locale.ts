// 사용자 표시 언어 저장 — 백엔드 UserLocalePreference 미러. 푸시·편지처럼 요청 헤더가 없는 서버 작업이 이 값을 쓴다
import { api } from '@/shared/api/client';

import type { Locale } from '../locale';

/** 반복 호출하면 마지막 값으로 덮어쓴다 */
export const updateUserLocale = (locale: Locale) =>
  api.put<null>('/api/v1/me/locale', { locale });
