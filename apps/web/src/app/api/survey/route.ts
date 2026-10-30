// 설문 응답을 받아 슈퍼베이스에 넣는 서버 라우트 — Secret 키를 서버에만 두고, 누구의 응답인지는 토큰으로 정한다.
// 테이블: survey_responses(id bigint 기본키, survey text not null default 'general', user_id bigint, email text, answers jsonb, created_at timestamptz default now())
// 결제자 설문을 붙이며 칸 셋을 더했다 —
//   alter table survey_responses add column survey text not null default 'general',
//     add column response_id uuid unique, add column completed boolean not null default true;
// 화면은 문항을 넘길 때마다 같은 응답 번호(response_id)로 지금까지의 답을 덮어쓰고, 제출할 때 completed=true로 마친다.
// 중간에 그만둬도 거기까지 쓴 답은 남는다. 응답 번호가 다르면(다시 참여) 새 행으로 쌓인다.
// 응답 봉투는 백엔드와 같은 { success, data, error } — 클라이언트의 api 클라이언트가 그대로 읽는다
import { NextResponse } from 'next/server';

import { isAnswers } from '@/features/survey/model/answer-shape';
import { fillsRequired, isSurveyKind } from '@/features/survey/model/surveys';
import { reportError } from '@/shared/monitoring/report';

import { readUserId } from './_model/access-token';

// 토큰이 진짜인지 백엔드에 묻는 데 쓰는 가벼운 인증 필요 API — 200이면 서명·만료가 확인된 것
const VERIFY_PATH = '/api/v1/me/learning-level';
const TABLE = 'survey_responses';
// 바깥 서버가 답이 없으면 이만큼만 기다린다 — 사용자가 제출 버튼에서 무한정 기다리지 않게
const UPSTREAM_TIMEOUT_MS = 10_000;

const ok = (data: unknown) => NextResponse.json({ success: true, data });
const fail = (status: number, message: string) =>
  NextResponse.json({ success: false, error: { message } }, { status });

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// 끊김·지연으로 fetch 자체가 실패하면 응답 대신 null — 호출부가 상태 코드 분기와 같은 자리에서 처리한다
const fetchUpstream = async (input: string, init: RequestInit) => {
  try {
    return await fetch(input, {
      ...init,
      signal: AbortSignal.timeout(UPSTREAM_TIMEOUT_MS),
    });
  } catch {
    return null;
  }
};

export async function POST(request: Request) {
  const supabaseUrl = process.env.SUPABASE_URL;
  const secretKey = process.env.SUPABASE_SECRET_KEY;
  const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;
  if (!supabaseUrl || !secretKey || !apiBaseUrl) {
    return fail(500, '설문 저장소가 설정되지 않았어요');
  }

  const authorization = request.headers.get('authorization');
  if (!authorization) return fail(401, '로그인이 필요해요');
  // 백엔드 필터와 같은 모양("Bearer ")만 — 다르게 쓰면 백엔드가 토큰으로 안 본다
  const userId = readUserId(authorization.replace(/^Bearer /, ''));
  if (userId === null) return fail(401, '로그인이 필요해요');

  // 백엔드에 묻기 전에 본문부터 — 모양이 틀린 요청에 바깥 왕복을 쓰지 않는다
  const body: unknown = await request.json().catch(() => null);
  if (!isRecord(body) || !isAnswers(body.answers)) {
    return fail(400, 'answers 모양이 맞지 않아요');
  }
  // 종류를 안 실은 건 결제자 설문 전에 열어 둔 화면이 보낸 일반 설문이다
  const survey = body.survey ?? 'general';
  if (!isSurveyKind(survey)) return fail(400, '모르는 설문이에요');
  // 응답 번호가 없으면 중간 저장 전에 열어 둔 화면이 한 번에 낸 응답이다
  const responseId = body.responseId;
  if (
    responseId !== undefined &&
    (typeof responseId !== 'string' || !UUID_PATTERN.test(responseId))
  ) {
    return fail(400, 'responseId 모양이 맞지 않아요');
  }
  // 필수 답은 다 낼 때만 본다 — 중간 저장은 아직 안 쓴 문항이 있는 게 정상이다
  const completed = body.completed !== false;
  if (completed && !fillsRequired(survey, body.answers)) {
    return fail(400, '필수 문항에 답하지 않았어요');
  }

  // 클라이언트가 토큰을 위조해 남의 id로 넣지 못하게 — 서명 키가 없으니 백엔드가 받아주는지로 판단한다
  const verified = await fetchUpstream(`${apiBaseUrl}${VERIFY_PATH}`, {
    headers: { Authorization: authorization },
  });
  // 본문은 안 본다 — 읽지 않은 스트림이 연결을 붙잡지 않게 버린다
  void verified?.body?.cancel();
  if (verified?.status === 401) return fail(401, '로그인이 필요해요');
  if (!verified?.ok) {
    reportError(new Error('[survey] 로그인 확인 실패'), {
      status: verified?.status ?? 'network',
    });
    return fail(502, '로그인 확인에 실패했어요');
  }

  // 응답 번호가 있으면 같은 번호의 행을 덮어쓴다(upsert)
  const target = responseId
    ? `${supabaseUrl}/rest/v1/${TABLE}?on_conflict=response_id`
    : `${supabaseUrl}/rest/v1/${TABLE}`;
  const inserted = await fetchUpstream(target, {
    method: 'POST',
    headers: {
      apikey: secretKey,
      Authorization: `Bearer ${secretKey}`,
      'Content-Type': 'application/json',
      // 넣은 행을 돌려받을 필요가 없다 — 성공 여부만 본다
      Prefer: responseId
        ? 'resolution=merge-duplicates,return=minimal'
        : 'return=minimal',
    },
    body: JSON.stringify({
      // 일반 설문은 칸의 기본값(general)에 맡긴다 — 옛 화면이 보낸 응답도 그대로 들어가게
      ...(survey !== 'general' && { survey }),
      ...(responseId && { response_id: responseId, completed }),
      user_id: userId,
      // 이메일은 응답을 볼 때 누군지 바로 보려는 참고값 — 신원은 user_id가 정한다
      email: typeof body.email === 'string' ? body.email : null,
      answers: body.answers,
    }),
  });

  if (!inserted?.ok) {
    reportError(new Error('[survey] 저장 실패'), {
      status: inserted?.status ?? 'network',
      detail: inserted ? await inserted.text() : 'fetch 실패',
    });
    return fail(502, '설문을 저장하지 못했어요');
  }
  return ok({ result: 'saved' });
}
