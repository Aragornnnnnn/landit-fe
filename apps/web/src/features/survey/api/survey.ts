// 설문 응답 저장 — 백엔드 API 없이 슈퍼베이스 REST(PostgREST)에 바로 넣는다. 임시 설문이라 SDK는 붙이지 않는다.
// 테이블: survey_responses(user_id bigint primary key, email text, answers jsonb, created_at timestamptz default now())
// 이메일은 쿠폰 줄 때 누군지 바로 보려고 같이 싣는다 — 애플 가리기·카카오 미동의면 없을 수 있어 null 허용
// user_id가 기본키라 같은 사람이 두 번 넣으면 409가 온다 — 그걸 "이미 참여"로 읽는다.
// 읽기 정책은 열지 않는다. anon 키로 남의 응답이 보이면 안 된다
import type { Answer } from '../model/answers';

export type SubmitResult = 'saved' | 'duplicate';

export interface SurveyRespondent {
  userId: number;
  email: string | null;
}

export const submitSurvey = async (
  respondent: SurveyRespondent,
  answers: Record<string, Answer>,
): Promise<SubmitResult> => {
  const baseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!baseUrl || !anonKey) {
    throw new Error('설문 저장소가 설정되지 않았어요');
  }

  const response = await fetch(`${baseUrl}/rest/v1/survey_responses`, {
    method: 'POST',
    headers: {
      apikey: anonKey,
      Authorization: `Bearer ${anonKey}`,
      'Content-Type': 'application/json',
      // 넣은 행을 돌려받을 필요가 없다 — 성공 여부만 본다
      Prefer: 'return=minimal',
    },
    body: JSON.stringify({
      user_id: respondent.userId,
      email: respondent.email,
      answers,
    }),
  });

  if (response.status === 409) return 'duplicate';
  if (!response.ok) {
    throw new Error('설문을 저장하지 못했어요');
  }
  return 'saved';
};
