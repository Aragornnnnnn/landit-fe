// 피드백 표시용 순수 함수 검증 — 평가 맥락 라벨 키, 총평 헤드라인, 잠긴 옛 응답 판정
import { describe, expect, it } from 'vitest';

import {
  evaluationContextLabelKey,
  isStaleLockedFeedback,
  summaryHeadline,
} from './feedback-view';

describe('isStaleLockedFeedback', () => {
  it('유료인데 잠긴 응답을 들고 있으면 무료일 때 받아 둔 옛 응답이다 — 다시 받아야 한다', () => {
    expect(isStaleLockedFeedback(true, { detailFeedbackLocked: true })).toBe(
      true,
    );
  });

  it.each([
    ['무료 사용자', false, { detailFeedbackLocked: true }],
    ['열린 응답', true, { detailFeedbackLocked: false }],
    ['응답이 아직 없음', true, null],
    ['구독 상태를 아직 모름', undefined, { detailFeedbackLocked: true }],
  ])('%s이면 다시 받지 않는다', (_, premium, feedback) => {
    expect(isStaleLockedFeedback(premium, feedback)).toBe(false);
  });
});

describe('evaluationContextLabelKey', () => {
  it('AI 발화 맥락은 질문으로 라벨링한다', () => {
    expect(evaluationContextLabelKey('AI_MESSAGE')).toBe('questionLabel');
  });

  it('시나리오 오프닝 지시문은 상황으로 라벨링한다', () => {
    expect(evaluationContextLabelKey('SCENARIO_OPENING_INSTRUCTION')).toBe(
      'situationLabel',
    );
  });
});

describe('summaryHeadline', () => {
  it('서버가 준 별점 문구를 그대로 쓴다', () => {
    expect(summaryHeadline('앞으로 혼자서도 유심을 살 수 있어요!')).toBe(
      '앞으로 혼자서도 유심을 살 수 있어요!',
    );
  });

  it.each([
    ['비어 있으면', ''],
    ['공백뿐이면', '  '],
  ])(
    '문구가 %s 없는 것으로 친다 — 화면이 기본 문구로 대신해 별점 문구 BE보다 먼저 배포돼도 헤드라인이 비지 않게',
    (_, message) => {
      expect(summaryHeadline(message)).toBeNull();
    },
  );
});
