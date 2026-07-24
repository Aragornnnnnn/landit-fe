// 스토어 리다이렉트 라우트 — 인스타 프로필 등에 다는 단일 링크. UA로 기기를 판별해 맞는 스토어로 보낸다
import { NextResponse } from 'next/server';

const APP_STORE_URL = 'https://apps.apple.com/kr/app/id6787414201';
const PLAY_STORE_URL =
  'https://play.google.com/store/apps/details?id=com.saynow.app';

export function GET(request: Request): NextResponse {
  const userAgent = request.headers.get('user-agent') ?? '';

  // Android만 Play 스토어, 나머지(iOS·데스크톱·UA 없음)는 전부 App Store
  if (/Android/i.test(userAgent)) return NextResponse.redirect(PLAY_STORE_URL);
  return NextResponse.redirect(APP_STORE_URL);
}
