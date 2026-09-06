// 기존 유저 게이트가 물을 질문 고르기 — 온보딩을 이미 마쳐서 스텝으로는 못 물은 것들을 모은다.
// 답했는지는 서버가 판단한다 (조회 응답의 null이 곧 "아직 안 답함"). 기기에는 따로 남기지 않는다 —
// 두 군데에 답이 있으면 다른 기기에서 바꿨을 때 어느 쪽이 진실인지 알 수 없다
import type { AccentLocale, GateQuestion } from '@landit/analytics';

// 온보딩 스텝과 같은 순서로 묻는다
const GATE_ORDER: GateQuestion[] = ['level', 'accent'];

// 값 있음 = 답했다, null = 안 답했다, undefined = 아직 모른다(조회 전이거나 실패).
// 셋을 구분해야 한쪽 조회가 실패해도 아는 쪽은 물을 수 있다
export interface ProfileAnswers {
  learningLevel?: number | null;
  accentLocale?: AccentLocale | null;
}

// 서버가 "안 답했다"고 말해 준 질문만 고른다 — 모르는 질문은 묻지 않는다.
// 이미 답한 사람에게 또 묻는 쪽이, 한 번 덜 묻는 쪽보다 나쁘다
export const collectPendingQuestions = (
  answers: ProfileAnswers,
): GateQuestion[] =>
  GATE_ORDER.filter((question) =>
    question === 'level'
      ? answers.learningLevel === null
      : answers.accentLocale === null,
  );
