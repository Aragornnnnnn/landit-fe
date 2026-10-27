// 로그인 상태가 되면 화면 언어를 서버 프로필에 맞춘다 — 루트 레이아웃에 마운트
'use client';

import { useEffect } from 'react';

import { useAuthStore } from '@/shared/auth/auth-store';
import { reportWarning } from '@/shared/monitoring/report';

import { updateUserLocale } from './api/user-locale';
import { JAPANESE_ENABLED } from './japanese-flag';
import { localeFromDocument } from './locale';

/**
 * 요청 헤더로는 서버 프로필이 바뀌지 않아 따로 보낸다. 비교 없이 매번 보낸다 —
 * 조회해서 비교해도 요청 수는 같고, 같은 값을 다시 저장해도 결과가 같다
 */
export const LocaleSync = () => {
  const userId = useAuthStore((state) => state.member?.userId);

  // 실행·로그인·계정 전환이 모두 여기로 온다
  useEffect(() => {
    // 일본어를 잠가 둔 동안은 모두 한국어라 서버 기본값(ko)과 같다 — 보낼 이유가 없다
    if (!userId || !JAPANESE_ENABLED) return;
    // 동기화 실패로 화면이 깨지면 안 된다 — 다음 실행에서 다시 보낸다
    updateUserLocale(localeFromDocument()).catch((error: unknown) => {
      console.warn('[locale] 동기화 실패:', error);
      reportWarning(error);
    });
  }, [userId]);

  return null;
};
