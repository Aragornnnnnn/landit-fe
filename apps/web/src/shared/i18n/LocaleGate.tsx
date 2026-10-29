'use client';

// 로그인한 사용자의 서비스 언어를 서버 저장값에 맞추는 문지기 — 루트 레이아웃에 마운트.
// 로그인·자동 로그인·앱 실행 때 저장 언어를 조회한다. 언어는 가입 때 백엔드가 기기 언어로 정하고, 웹은 저장하지 않는다
import { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { usePathname, useRouter } from 'next/navigation';

import { useAuthStore } from '@/shared/auth/auth-store';

import { getUserLocale } from './api/user-locale';
import { localeFromDocument, saveLocaleCookie, type Locale } from './locale';

/** 저장 언어를 서버 렌더가 읽는 쿠키에 담고, 지금 화면과 다르면 서버 렌더를 다시 받는다 */
const applyLocale = (locale: Locale, refresh: () => void) => {
  saveLocaleCookie(locale);
  if (localeFromDocument() !== locale) refresh();
};

export const LocaleGate = () => {
  const userId = useAuthStore((state) => state.member?.userId ?? null);
  const router = useRouter();
  const pathname = usePathname();
  // 캐시는 계정마다 따로 — 계정을 바꾸면 그 계정의 저장 언어를 새로 읽는다
  const { data } = useQuery({
    queryKey: ['userLocale', userId],
    queryFn: getUserLocale,
    enabled: userId !== null,
    staleTime: Infinity,
  });
  // 백엔드 응답 언어를 따른다 — selectionRequired여도 콘텐츠가 그 언어(임시 ko)로 나오니 화면도 맞춘다. 조회가 실패하면 지금 화면을 둔다
  const savedLocale = data?.locale ?? null;
  // 이동이 끝날 때마다 다시 맞춘다 — 다시 그리기는 뒤따른 이동에 밀려 버려질 수 있다
  useEffect(() => {
    if (savedLocale) applyLocale(savedLocale, router.refresh);
  }, [savedLocale, router, pathname]);

  return null;
};
