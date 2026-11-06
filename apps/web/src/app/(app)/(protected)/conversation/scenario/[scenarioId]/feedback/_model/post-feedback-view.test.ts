// 피드백 뒤 갈 곳 판정 — 재대화·유료·무료 첫 시나리오·무료 그 뒤 네 갈래
import { describe, expect, it } from 'vitest';

import { decidePostFeedbackView } from './post-feedback-view';

describe('decidePostFeedbackView', () => {
  it('재대화면 무엇이든 홈으로 간다', () => {
    expect(
      decidePostFeedbackView({
        replay: true,
        learningLocked: true,
        detailFeedbackLocked: false,
      }),
    ).toBe('home');
  });

  it('잠기지 않는 사람(유료·브라우저·플래그 꺼짐)은 표현 분기로 바로 간다', () => {
    expect(
      decidePostFeedbackView({
        replay: false,
        learningLocked: false,
        detailFeedbackLocked: false,
      }),
    ).toBe('branch');
  });

  it('무료 사용자의 첫 시나리오는 레벨 분석부터 본다 — 서버가 상세를 열어 준 세션이 그 자리다', () => {
    expect(
      decidePostFeedbackView({
        replay: false,
        learningLocked: true,
        detailFeedbackLocked: false,
      }),
    ).toBe('analyzing');
  });

  it('무료 사용자의 두 번째 시나리오부터는 총평에서 끝나고 홈으로 간다 — 대화를 끝낼 때마다 레벨 화면이 또 뜨지 않는다', () => {
    expect(
      decidePostFeedbackView({
        replay: false,
        learningLocked: true,
        detailFeedbackLocked: true,
      }),
    ).toBe('home');
  });
});
