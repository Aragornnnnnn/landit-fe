'use client';

// 화면 언어를 앰플리튜드 유저 속성(app_language)으로 올리는 무렌더 컴포넌트 — 루트 레이아웃에 마운트.
// 로그인 뒤 서버 저장 언어로 화면이 바뀌면(LocaleGate) 그 순간 다시 올려, 다음 실행까지 옛 언어로 남지 않게 한다.
// 계정을 바꿔 로그인하면 언어가 같아도 새 프로필에 다시 올린다
import { useEffect } from 'react';
import { useLocale } from 'next-intl';

import { useCurrentUserId } from '@/shared/auth/current-member';

import { setUserProperties } from './amplitude';

export const LanguagePropertySync = () => {
  const locale = useLocale();
  const userId = useCurrentUserId();

  useEffect(() => {
    setUserProperties({ app_language: locale });
  }, [locale, userId]);

  return null;
};
