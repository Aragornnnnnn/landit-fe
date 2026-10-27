'use client';

// 로그인한 사용자의 서비스 언어를 서버 저장값에 맞추는 문지기 — 루트 레이아웃에 마운트.
// 로그인·자동 로그인·앱 재진입마다 저장 언어를 조회하고, 아직 고르지 않았으면 한국어·日本語 선택 화면을 띄운다.
// 기기 언어가 바뀌었다고 저장하지 않는다 — 저장은 사용자가 고를 때 한 번뿐이다
import { useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';

import { useAuthStore } from '@/shared/auth/auth-store';

import {
  getUserLocale,
  updateUserLocale,
  type UserLocale,
} from './api/user-locale';
import { LOCALE_COOKIE, localeFromDocument, type Locale } from './locale';
import { LocaleSelectScreen } from './LocaleSelectScreen';

const ONE_YEAR_SECONDS = 60 * 60 * 24 * 365;

/** 저장 언어를 서버 렌더가 읽는 쿠키에 담고, 지금 화면과 다르면 서버 렌더를 다시 받는다 */
const applyLocale = (locale: Locale, refresh: () => void) => {
  document.cookie = `${LOCALE_COOKIE}=${locale}; path=/; max-age=${ONE_YEAR_SECONDS}; samesite=lax`;
  if (localeFromDocument() !== locale) refresh();
};

export const LocaleGate = () => {
  const userId = useAuthStore((state) => state.member?.userId ?? null);
  const router = useRouter();
  const queryClient = useQueryClient();
  // 캐시는 계정마다 따로 — 계정을 바꾸면 그 계정의 저장 언어를 새로 읽는다
  const queryKey = ['userLocale', userId] as const;
  const { data } = useQuery({
    queryKey,
    queryFn: getUserLocale,
    enabled: userId !== null,
    staleTime: Infinity,
  });
  const select = useMutation({
    mutationFn: (locale: Locale) => updateUserLocale(locale),
    onSuccess: (saved: UserLocale) => queryClient.setQueryData(queryKey, saved),
  });

  // 고른 적이 있으면 저장값을 따른다. 조회가 실패하면 아무것도 저장하지 않고 지금 화면을 둔다(react-query가 다시 시도한다)
  const savedLocale = data && !data.selectionRequired ? data.locale : null;
  useEffect(() => {
    if (savedLocale) applyLocale(savedLocale, router.refresh);
  }, [savedLocale, router]);

  if (!data?.selectionRequired) return null;
  return (
    <LocaleSelectScreen
      pending={select.isPending}
      failed={select.isError}
      onSelect={(locale) => select.mutate(locale)}
    />
  );
};
