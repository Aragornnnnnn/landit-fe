// scenarioKeyterms — 시나리오·질문에 맞는 음성 인식 키워드 하나만 골라 캐릭터 이름과 함께 내는지 검증한다
import { describe, expect, it } from 'vitest';

import {
  QUESTION_KEYTERMS,
  SCENARIO_KEYTERMS,
  scenarioKeyterms,
} from './scenario-keyterms';

const NAMES = ['Chloe', 'Marco', 'Teddy'];

describe('scenarioKeyterms', () => {
  it('목록이 있는 시나리오면 캐릭터 이름 뒤에 그 시나리오 키워드를 붙인다', () => {
    const keyterms = scenarioKeyterms({
      scenarioId: 40,
      firstSpeaker: 'AI',
      turnIndex: 0,
    });

    expect(keyterms).toEqual([...NAMES, 'USIM', 'SIM', 'eSIM', 'SNS']);
  });

  it('목록이 없는 시나리오면 캐릭터 이름만 낸다', () => {
    const keyterms = scenarioKeyterms({
      scenarioId: 99999,
      firstSpeaker: 'AI',
      turnIndex: 0,
    });

    expect(keyterms).toEqual(NAMES);
  });

  it('질문별로 나눈 시나리오면 지금 질문의 목록만 쓴다', () => {
    // given — AI 선발화라 turnIndex 1이 두 번째 질문(취미)이다
    const keyterms = scenarioKeyterms({
      scenarioId: 1,
      firstSpeaker: 'AI',
      turnIndex: 1,
    });

    expect(keyterms).toEqual([...NAMES, 'SNS', 'OTT']);
  });

  it('USER 선발화면 안내 카드 다음 턴부터 첫 질문으로 센다', () => {
    const keyterms = scenarioKeyterms({
      scenarioId: 215,
      firstSpeaker: 'USER',
      turnIndex: 3,
    });

    expect(keyterms).toEqual([...NAMES, 'hanok', 'hanbok']);
  });

  it('질문별로 나눈 시나리오에서 질문이 아닌 턴이면 캐릭터 이름만 낸다', () => {
    // given — USER 선발화의 turnIndex 0은 먼저 말을 거는 안내 카드다
    const keyterms = scenarioKeyterms({
      scenarioId: 215,
      firstSpeaker: 'USER',
      turnIndex: 0,
    });

    expect(keyterms).toEqual(NAMES);
  });

  // 한 요청에 너무 많이 실으면 키워드 효과가 흐려진다 — 목록을 늘릴 때 이 상한을 지킨다
  it('어느 시나리오·질문이든 한 번에 넘기는 키워드는 20개를 넘지 않는다', () => {
    const lists = [
      ...Object.values(SCENARIO_KEYTERMS),
      ...Object.values(QUESTION_KEYTERMS).flat(),
    ];

    for (const list of lists) {
      expect(NAMES.length + list.length).toBeLessThanOrEqual(20);
    }
  });
});
