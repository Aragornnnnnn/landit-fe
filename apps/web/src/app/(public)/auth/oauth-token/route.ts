// code→id_token 교환을 서버에서 중계 — client_secret/REST 키를 브라우저에 노출하지 않으려고 서버 라우트로 처리
import { NextResponse } from 'next/server';

const GOOGLE_TOKEN_URL = 'https://oauth2.googleapis.com/token';
const KAKAO_TOKEN_URL = 'https://kauth.kakao.com/oauth/token';

interface ExchangeBody {
  provider?: string;
  code?: string;
  redirectUri?: string;
  codeVerifier?: string;
}

export async function POST(request: Request) {
  const body = (await request.json().catch(() => ({}))) as ExchangeBody;
  if (!body.provider || !body.code || !body.redirectUri)
    return NextResponse.json(
      { error: '요청 값이 올바르지 않아요.' },
      {
        status: 400,
      },
    );

  try {
    const idToken = await exchangeCodeForIdToken(body);
    return NextResponse.json({ idToken });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : '토큰 교환에 실패했어요.';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

function exchangeCodeForIdToken(body: ExchangeBody): Promise<string> {
  switch (body.provider?.toLowerCase()) {
    case 'google':
      return exchangeGoogleCode(body);
    case 'kakao':
      return exchangeKakaoCode(body);
    default:
      throw new Error('지원하지 않는 소셜 로그인 제공자예요.');
  }
}

async function exchangeGoogleCode(body: ExchangeBody): Promise<string> {
  const clientId =
    process.env.NEXT_PUBLIC_GOOGLE_WEB_CLIENT_ID ??
    process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
  if (!clientId) throw new Error('Google client ID가 설정되지 않았어요.');
  if (!body.codeVerifier)
    throw new Error('Google PKCE code verifier가 없어요.');

  const params: Record<string, string> = {
    grant_type: 'authorization_code',
    client_id: clientId,
    code: body.code as string,
    redirect_uri: body.redirectUri as string,
    code_verifier: body.codeVerifier,
  };
  // 웹 클라이언트 유형이면 secret이 필요하고, PKCE 전용 유형이면 없어도 된다
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  if (clientSecret) params.client_secret = clientSecret;

  return requestIdToken(GOOGLE_TOKEN_URL, params);
}

async function exchangeKakaoCode(body: ExchangeBody): Promise<string> {
  const clientId = process.env.NEXT_PUBLIC_KAKAO_REST_API_KEY;
  if (!clientId)
    throw new Error(
      'Kakao REST API 키(NEXT_PUBLIC_KAKAO_REST_API_KEY)가 설정되지 않았어요.',
    );

  const params: Record<string, string> = {
    grant_type: 'authorization_code',
    client_id: clientId,
    code: body.code as string,
    redirect_uri: body.redirectUri as string,
  };
  const clientSecret = process.env.KAKAO_CLIENT_SECRET;
  if (clientSecret) params.client_secret = clientSecret;

  return requestIdToken(KAKAO_TOKEN_URL, params);
}

async function requestIdToken(
  url: string,
  params: Record<string, string>,
): Promise<string> {
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams(params).toString(),
  });
  const data = (await response.json().catch(() => ({}))) as {
    id_token?: string;
    error_description?: string;
    error?: string;
  };
  if (!response.ok || !data.id_token)
    throw new Error(
      data.error_description ?? data.error ?? '토큰 교환에 실패했어요.',
    );
  return data.id_token;
}
