// Deepgram 단기 임시 토큰을 발급해 클라이언트에 전달하는 라우트 — 원본 키 노출 방지
import { NextResponse } from 'next/server';

const GRANT_URL = 'https://api.deepgram.com/v1/auth/grant';
// 토큰은 WS 최초 연결 시점에만 유효하면 되므로 짧게 — fetch 직후 연결하는 흐름이라 60초면 충분
const TOKEN_TTL_SECONDS = 60;

export async function POST() {
  const apiKey = process.env.DEEPGRAM_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: 'DEEPGRAM_API_KEY가 설정되지 않았습니다.' },
      { status: 500 },
    );
  }

  const res = await fetch(GRANT_URL, {
    method: 'POST',
    headers: {
      Authorization: `Token ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ ttl_seconds: TOKEN_TTL_SECONDS }),
  });

  if (!res.ok) {
    console.error('[stt/token] grant 실패:', await res.text());
    return NextResponse.json({ error: '임시 토큰 발급 실패' }, { status: 502 });
  }

  const { access_token } = (await res.json()) as { access_token: string };
  return NextResponse.json({ token: access_token });
}
