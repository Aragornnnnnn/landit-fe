// 설문 응답 제출 — 우리 서버 라우트(app/api/survey)에 보낸다. 누구의 응답인지는 서버가 토큰으로 정하고,
// 슈퍼베이스 키도 서버에만 있다. 토큰 부착·만료 재발급은 api 클라이언트가 알아서 한다.
// 이미 참여한 사람도 서버가 성공으로 답한다 — 두 번 낼 수 없다는 걸 따로 설명할 이유가 없어 화면은 둘 다 완료로 본다
import { api } from '@/shared/api/client';

import type { Answer } from '../model/answers';

export const submitSurvey = async (
  // 쿠폰 줄 때 누군지 바로 보려는 참고값 — 애플 가리기·카카오 미동의면 없다
  email: string | null,
  answers: Record<string, Answer>,
): Promise<void> => {
  await api.post('/api/survey', { email, answers });
};
