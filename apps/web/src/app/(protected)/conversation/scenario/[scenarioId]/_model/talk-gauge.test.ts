// toTalkGauge — 내가 말할 횟수만큼 균등하게 차오르는 비율·완료 톤·마지막 질문 판정을 검증한다
import { describe, expect, it } from 'vitest';

import { toTalkGauge } from './talk-gauge';

// AI 선발화 3문항 — 고정 질문이 turnIndex 0부터 뜬다
const aiFirst = (turnIndex: number, totalQuestionCount: number | null = 3) =>
  toTalkGauge({ turnIndex, firstSpeaker: 'AI', totalQuestionCount });

// USER 선발화 3문항 — turnIndex 0은 "먼저 말을 걸어보세요" 안내 카드다
const userFirst = (turnIndex: number) =>
  toTalkGauge({ turnIndex, firstSpeaker: 'USER', totalQuestionCount: 3 });

describe('toTalkGauge', () => {
  it.each<[string, number, number, boolean]>([
    ['첫 질문', 0, 0.08, false],
    ['두 번째 질문', 1, 0.387, false],
    ['마지막 질문', 2, 0.693, true],
    ['종료 인사', 3, 1, false],
  ])(
    'AI 선발화 3문항의 %s에서는 게이지가 그만큼 차 있다',
    (_card, turnIndex, ratio, lastQuestion) => {
      const gauge = aiFirst(turnIndex);

      expect(gauge.ratio).toBeCloseTo(ratio, 3);
      expect(gauge.lastQuestion).toBe(lastQuestion);
    },
  );

  // USER 선발화는 고정 질문 앞에 안내 카드가 한 턴 더 있다 — 서버의 고정 질문 개수엔 그 턴이 없다
  it.each<[string, number, number, boolean]>([
    ['안내 카드', 0, 0.08, false],
    ['첫 질문', 1, 0.31, false],
    ['두 번째 질문', 2, 0.54, false],
    ['마지막 질문', 3, 0.77, true],
    ['종료 인사', 4, 1, false],
  ])(
    'USER 선발화 3문항의 %s에서는 안내 턴까지 세어 나눈다',
    (_card, turnIndex, ratio, lastQuestion) => {
      const gauge = userFirst(turnIndex);

      expect(gauge.ratio).toBeCloseTo(ratio, 3);
      expect(gauge.lastQuestion).toBe(lastQuestion);
    },
  );

  it('총 질문 수를 아직 모르면(세션 응답 전) 바닥값에 머문다', () => {
    const gauge = aiFirst(0, null);

    expect(gauge.ratio).toBeCloseTo(0.08, 3);
    expect(gauge.lastQuestion).toBe(false);
  });

  it('총 질문 수가 0이어도 나눗셈에 넣지 않고 바닥값에 머문다', () => {
    expect(aiFirst(0, 0).ratio).toBeCloseTo(0.08, 3);
  });

  it('질문을 다 지나면 success 톤이 된다', () => {
    expect(aiFirst(2).tone).toBe('primary');
    expect(aiFirst(3).tone).toBe('success');
  });

  it('종료 인사를 넘어선 턴에서도 비율은 1을 넘지 않는다', () => {
    expect(aiFirst(9).ratio).toBe(1);
  });
});
