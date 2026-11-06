// 랜딩 계측 규칙 — 주소에서 화면·언어를, 다운로드 링크에서 버튼 자리·스토어를 읽고, 머문 시간을 초로 센다
import type {
  AppLanguage,
  LandingPage,
  LandingPlacement,
} from '@landit/analytics';

import { localeFromPath } from '@/shared/i18n/locale';

const SUB_PAGES: Record<string, LandingPage> = {
  updates: 'updates',
  terms: 'terms',
  privacy: 'privacy',
};

/** 랜딩 주소의 화면과 언어 — 랜딩이 아닌 주소면 null */
export const landingPageOf = (
  pathname: string,
): { page: LandingPage; language: AppLanguage } | null => {
  const language = localeFromPath(pathname);
  if (!language) return null;
  const rest = pathname.split('/').filter(Boolean).slice(1);
  if (rest.length === 0) return { page: 'home', language };
  const page = rest.length === 1 ? SUB_PAGES[rest[0]] : undefined;
  return page ? { page, language } : null;
};

const PLACEMENTS: readonly string[] = ['hero', 'closing'];
const STORES = ['play_store', 'app_store'] as const;

/** 누른 링크가 /download면 버튼 자리와 (배지라면) 고른 스토어 — 아니면 null */
export const downloadClickOf = (
  href: string,
  placement: string | null,
): { placement: LandingPlacement; store?: (typeof STORES)[number] } | null => {
  const url = new URL(href, 'https://www.landit.im');
  if (url.pathname !== '/download') return null;
  if (!placement || !PLACEMENTS.includes(placement)) return null;
  const store = STORES.find((value) => value === url.searchParams.get('store'));
  return {
    placement: placement as LandingPlacement,
    ...(store && { store }),
  };
};

/** 머문 시간(초, 정수) — 시계가 뒤로 가도 0보다 작지 않다 */
export const dwellSeconds = (startedAt: number, now: number) =>
  Math.max(0, Math.round((now - startedAt) / 1000));
