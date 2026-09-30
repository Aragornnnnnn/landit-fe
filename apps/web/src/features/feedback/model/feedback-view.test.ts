// 피드백 표시용 순수 함수 검증 — 평가 맥락 라벨, CTA 문구
import { describe, expect, it } from 'vitest';

import {
  detailCtaLabel,
  evaluationContextLabel,
  LOCKED_DETAIL_CTA_LABEL,
} from './feedback-view';

describe('evaluationContextLabel', () => {
  it('AI 발화 맥락은 질문으로 라벨링한다', () => {
    expect(evaluationContextLabel('AI_MESSAGE')).toBe('질문');
  });

  it('시나리오 오프닝 지시문은 상황으로 라벨링한다', () => {
    expect(evaluationContextLabel('SCENARIO_OPENING_INSTRUCTION')).toBe('상황');
  });
});

describe('detailCtaLabel', () => {
  it('개선할 턴이 남으면 걸음 수를 넣어 안내한다', () => {
    expect(detailCtaLabel(1)).toBe('원어민까지 1걸음, 고쳐볼게요');
  });

  it('개선할 턴이 없으면 잘한 점을 보라고 안내한다', () => {
    expect(detailCtaLabel(0)).toBe('뭐가 잘 통했는지 볼게요');
  });

  it('잠긴 세션의 문구는 걸음 수 문구와 겹치지 않는다 — 턴 수를 모르는 자리에 0걸음 문구가 나가면 안 된다', () => {
    expect(LOCKED_DETAIL_CTA_LABEL).not.toBe(detailCtaLabel(0));
  });
});
