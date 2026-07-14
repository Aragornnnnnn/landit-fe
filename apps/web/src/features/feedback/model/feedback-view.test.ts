// 피드백 표시용 순수 함수 검증 — 평가 맥락 라벨, 총평 헤드라인, CTA 문구
import { describe, expect, it } from 'vitest';

import {
  detailCtaLabel,
  evaluationContextLabel,
  scoreHeadline,
} from './feedback-view';

describe('evaluationContextLabel', () => {
  it('AI 발화 맥락은 질문으로 라벨링한다', () => {
    expect(evaluationContextLabel('AI_MESSAGE')).toBe('질문');
  });

  it('시나리오 오프닝 지시문은 상황으로 라벨링한다', () => {
    expect(evaluationContextLabel('SCENARIO_OPENING_INSTRUCTION')).toBe('상황');
  });
});

describe('scoreHeadline', () => {
  it('점수 구간마다 다른 헤드라인을 돌려준다', () => {
    expect(scoreHeadline(95)).not.toBe(scoreHeadline(85));
    expect(scoreHeadline(85)).toBe('거의 원어민처럼 착지했어요');
    expect(scoreHeadline(20)).toBe('아직 착지까지 연습이 필요해요');
  });

  it('구간 경계값은 위쪽 구간에 포함된다', () => {
    expect(scoreHeadline(80)).toBe(scoreHeadline(89));
    expect(scoreHeadline(79)).not.toBe(scoreHeadline(80));
  });
});

describe('detailCtaLabel', () => {
  it('개선할 턴이 남으면 걸음 수를 넣어 안내한다', () => {
    expect(detailCtaLabel(1)).toBe('원어민까지 1걸음, 고쳐볼게요');
  });

  it('개선할 턴이 없으면 잘한 점을 보라고 안내한다', () => {
    expect(detailCtaLabel(0)).toBe('뭐가 잘 통했는지 볼게요');
  });
});
