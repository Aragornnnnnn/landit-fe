// 설문 응답 제출 — 우리 서버 라우트(app/api/survey)에 보낸다. 누구의 응답인지는 서버가 토큰으로 정하고,
// 슈퍼베이스 키도 서버에만 있다. 토큰 부착·만료 재발급은 api 클라이언트가 알아서 한다.
// 같은 사람이 또 내도 새 응답으로 쌓인다
import { api } from '@/shared/api/client';

import type { Answer } from '../model/answers';

export const submitSurvey = async (
  // 응답을 볼 때 누군지 바로 보려는 참고값 — 애플 가리기·카카오 미동의면 없다
  email: string | null,
  answers: Record<string, Answer>,
): Promise<void> => {
  await api.post('/api/survey', { email, answers });
};
