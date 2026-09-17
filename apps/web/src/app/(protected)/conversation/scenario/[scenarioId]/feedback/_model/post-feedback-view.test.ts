// 피드백 뒤 갈 곳 판정 — 재대화·유료·무료 세 갈래
import { describe, expect, it } from 'vitest';

import { decidePostFeedbackView } from './post-feedback-view';

describe('decidePostFeedbackView', () => {
  it('재대화면 무엇이든 홈으로 간다', () => {
    expect(decidePostFeedbackView({ wasCompleted: true, locked: true })).toBe(
      'home',
    );
  });

  it('잠기지 않는 사람(유료·브라우저·플래그 꺼짐)은 표현 분기로 바로 간다', () => {
    expect(decidePostFeedbackView({ wasCompleted: false, locked: false })).toBe(
      'branch',
    );
  });

  it('무료 사용자는 신규·기존 가리지 않고 레벨 분석부터 본다', () => {
    expect(decidePostFeedbackView({ wasCompleted: false, locked: true })).toBe(
      'analyzing',
    );
  });
});
