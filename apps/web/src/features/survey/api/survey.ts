// 설문 응답 제출 — 우리 서버 라우트(app/api/survey)에 보낸다. 누구의 응답인지는 서버가 토큰으로 정하고,
// 슈퍼베이스 키도 서버에만 있다. 토큰 부착·만료 재발급은 api 클라이언트가 알아서 한다.
// 문항을 넘길 때마다 같은 응답 번호로 덮어쓰고(completed=false), 제출할 때 completed=true로 마친다
import type { SurveyKind } from '@landit/analytics';

import { api } from '@/shared/api/client';

import type { Answer } from '../model/answers';

export const submitSurvey = async (
  survey: SurveyKind,
  // 응답을 볼 때 누군지 바로 보려는 참고값 — 애플 가리기·카카오 미동의면 없다
  email: string | null,
  answers: Record<string, Answer>,
  progress: { responseId: string; completed: boolean },
): Promise<void> => {
  await api.post('/api/survey', { survey, email, answers, ...progress });
};
