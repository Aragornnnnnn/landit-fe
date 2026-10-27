// 사용자 서비스 언어 조회·저장 — 백엔드 UserLocale 미러. 신규 가입 때 기기 언어로 정하고, 이후엔 이 저장값이 화면·콘텐츠 언어의 기준이다
import { api } from '@/shared/api/client';

import type { Locale } from '../locale';

/** 백엔드 응답 원형 — selectionRequired면 아직 고르지 않은 상태이고, 그때의 locale은 구버전 호환용 임시값이다 */
export interface UserLocale {
  locale: Locale;
  selectionRequired: boolean;
}

export const getUserLocale = () => api.get<UserLocale>('/api/v1/me/locale');

/** 사용자가 직접 고른 값만 보낸다 — 기기 언어가 바뀌었다고 보내지 않는다 */
export const updateUserLocale = (locale: Locale) =>
  api.put<UserLocale>('/api/v1/me/locale', { locale });
