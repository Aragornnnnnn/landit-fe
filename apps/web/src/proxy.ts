// 랜딩 주소 언어 처리 — 루트(/)는 언어 랜딩으로 보내고, /ko·/ja 요청엔 서버 렌더가 읽을 언어 헤더를 붙인다. 앱 화면 요청엔 돌지 않는다
import { NextResponse, type NextRequest } from 'next/server';

import {
  LOCALE_COOKIE,
  localeFromPath,
  PATH_LOCALE_HEADER,
  resolveRequestLocale,
} from '@/shared/i18n/locale';

export const proxy = (request: NextRequest) => {
  const pathLocale = localeFromPath(request.nextUrl.pathname);

  if (pathLocale) {
    const headers = new Headers(request.headers);
    headers.set(PATH_LOCALE_HEADER, pathLocale);
    return NextResponse.next({ request: { headers } });
  }

  // 앱과 같은 순서로 정한다 — 저장 언어 쿠키, 기기 언어, 한국어. 셸도 처음엔 루트를 열어 이 길을 지난다
  const locale = resolveRequestLocale(
    request.cookies.get(LOCALE_COOKIE)?.value ?? null,
    request.headers.get('accept-language'),
  );
  const url = request.nextUrl.clone();
  url.pathname = `/${locale}`;
  return NextResponse.redirect(url, 307);
};

export const config = {
  matcher: ['/', '/ko', '/ko/:path*', '/ja', '/ja/:path*'],
};
