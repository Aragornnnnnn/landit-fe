// 피드백 뒤 갈 곳 판정 — 재대화·유료·무료 신규·무료 기존 네 갈래
import { describe, expect, it } from 'vitest';

import { decidePostFeedbackView } from './post-feedback-view';

describe('decidePostFeedbackView', () => {
  it('재대화면 무엇이든 홈으로 간다', () => {
    expect(
      decidePostFeedbackView({
        wasCompleted: true,
        locked: true,
        firstEver: true,
      }),
    ).toBe('home');
  });

  it('잠기지 않는 사람(유료·브라우저·플래그 꺼짐)은 표현 분기로 바로 간다', () => {
    expect(
      decidePostFeedbackView({
        wasCompleted: false,
        locked: false,
        firstEver: true,
      }),
    ).toBe('branch');
  });

  it('무료 사용자의 생애 첫 대화면 레벨 분석부터 본다', () => {
    expect(
      decidePostFeedbackView({
        wasCompleted: false,
        locked: true,
        firstEver: true,
      }),
    ).toBe('analyzing');
  });

  it('무료 기존 사용자는 분석 없이 학습 준비 화면으로 간다', () => {
    expect(
      decidePostFeedbackView({
        wasCompleted: false,
        locked: true,
        firstEver: false,
      }),
    ).toBe('prepared');
  });

  it('첫 대화인지 모르면 첫 대화로 치지 않는다 — 기다리는 화면을 잘못 보여주지 않는다', () => {
    expect(
      decidePostFeedbackView({
        wasCompleted: false,
        locked: true,
        firstEver: null,
      }),
    ).toBe('prepared');
  });
});
