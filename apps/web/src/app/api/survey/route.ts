// 설문 응답을 받아 슈퍼베이스에 넣는 서버 라우트 — Secret 키를 서버에만 두고, 누구의 응답인지는 토큰으로 정한다.
// 테이블: survey_responses(user_id bigint primary key, email text, answers jsonb, created_at timestamptz default now())
// user_id가 기본키라 같은 사람이 두 번 넣으면 409가 온다 — 그걸 "이미 참여"로 돌려준다.
// 응답 봉투는 백엔드와 같은 { success, data, error } — 클라이언트의 api 클라이언트가 그대로 읽는다
import { NextResponse } from 'next/server';

import { reportError } from '@/shared/monitoring/report';

import { readUserId } from './_model/access-token';

// 토큰이 진짜인지 백엔드에 묻는 데 쓰는 가벼운 인증 필요 API — 200이면 서명·만료가 확인된 것
const VERIFY_PATH = '/api/v1/me/learning-level';
const TABLE = 'survey_responses';

const ok = (data: unknown) => NextResponse.json({ success: true, data });
const fail = (status: number, message: string) =>
  NextResponse.json({ success: false, error: { message } }, { status });

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

export async function POST(request: Request) {
  const supabaseUrl = process.env.SUPABASE_URL;
  const secretKey = process.env.SUPABASE_SECRET_KEY;
  const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;
  if (!supabaseUrl || !secretKey || !apiBaseUrl) {
    return fail(500, '설문 저장소가 설정되지 않았어요');
  }

  const authorization = request.headers.get('authorization');
  const userId = authorization
    ? readUserId(authorization.replace(/^Bearer\s+/i, ''))
    : null;
  if (!authorization || userId === null) {
    return fail(401, '로그인이 필요해요');
  }

  // 클라이언트가 토큰을 위조해 남의 id로 넣지 못하게 — 서명 키가 없으니 백엔드가 받아주는지로 판단한다
  const verified = await fetch(`${apiBaseUrl}${VERIFY_PATH}`, {
    headers: { Authorization: authorization },
  });
  if (verified.status === 401) return fail(401, '로그인이 필요해요');
  if (!verified.ok) {
    reportError(new Error('[survey] 로그인 확인 실패'), {
      status: verified.status,
    });
    return fail(502, '로그인 확인에 실패했어요');
  }

  const body: unknown = await request.json().catch(() => null);
  if (!isRecord(body) || !isRecord(body.answers)) {
    return fail(400, 'answers가 필요해요');
  }

  const inserted = await fetch(`${supabaseUrl}/rest/v1/${TABLE}`, {
    method: 'POST',
    headers: {
      apikey: secretKey,
      Authorization: `Bearer ${secretKey}`,
      'Content-Type': 'application/json',
      // 넣은 행을 돌려받을 필요가 없다 — 성공 여부만 본다
      Prefer: 'return=minimal',
    },
    body: JSON.stringify({
      user_id: userId,
      // 이메일은 쿠폰 줄 때 누군지 바로 보려는 참고값 — 신원은 user_id가 정한다
      email: typeof body.email === 'string' ? body.email : null,
      answers: body.answers,
    }),
  });

  if (inserted.status === 409) return ok({ result: 'duplicate' });
  if (!inserted.ok) {
    reportError(new Error('[survey] 저장 실패'), {
      status: inserted.status,
      detail: await inserted.text(),
    });
    return fail(502, '설문을 저장하지 못했어요');
  }
  return ok({ result: 'saved' });
}
