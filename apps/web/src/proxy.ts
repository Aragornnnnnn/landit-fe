// [로컬 전용, 커밋 금지] 실기기·시뮬레이터 웹뷰가 맥 IP나 다른 포트로 dev 서버를 볼 때,
// /api 프록시가 넘기는 Origin을 dev 백엔드 CORS 허용값(localhost:3000)으로 바꿔 403을 피한다
import { NextResponse, type NextRequest } from 'next/server';

const ALLOWED_DEV_ORIGIN = 'http://localhost:3000';

export function proxy(request: NextRequest) {
  if (process.env.NODE_ENV !== 'development') return NextResponse.next();

  const headers = new Headers(request.headers);
  headers.set('origin', ALLOWED_DEV_ORIGIN);
  headers.set('referer', `${ALLOWED_DEV_ORIGIN}/`);
  return NextResponse.next({ request: { headers } });
}

export const config = {
  matcher: '/api/:path*',
};
