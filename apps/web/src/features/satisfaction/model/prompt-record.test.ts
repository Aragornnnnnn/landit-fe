// prompt-record — 대화 종류별로 "물을 차례"와 "답한 기록"을 기기에 남기는 계약 검증
import { beforeEach, describe, expect, it } from 'vitest';

import {
  consumeTalkPending,
  markTalkCompleted,
  mayAskAppSatisfaction,
  PROMPT_RECORD_KEY,
  readSatisfactionAnswer,
  recordSatisfactionAnswer,
  shouldAskAppSatisfaction,
  shouldAskSatisfaction,
} from './prompt-record';

beforeEach(() => localStorage.clear());

describe('shouldAskSatisfaction', () => {
  it('대화를 마친 기록이 없으면 묻지 않는다', () => {
    expect(shouldAskSatisfaction('scenario')).toBe(false);
  });

  it('대화를 마쳤고 아직 답한 적 없으면 묻는다', () => {
    markTalkCompleted('scenario');

    expect(shouldAskSatisfaction('scenario')).toBe(true);
  });

  it.each([['good'], ['bad'], ['dismiss']] as const)(
    '한 번 답했으면(%s) 다시 대화를 마쳐도 묻지 않는다',
    (answer) => {
      // Given 지난번에 물었고 어떤 식으로든 끝낸 상태에서
      markTalkCompleted('scenario');
      recordSatisfactionAnswer('scenario', answer);

      // When 다음 대화를 또 마치면
      markTalkCompleted('scenario');

      // Then 다시 묻지 않는다
      expect(shouldAskSatisfaction('scenario')).toBe(false);
    },
  );

  it('시나리오와 스몰톡은 따로 센다 — 시나리오에 답했어도 첫 스몰톡은 묻는다', () => {
    markTalkCompleted('scenario');
    recordSatisfactionAnswer('scenario', 'good');
    markTalkCompleted('smalltalk');

    expect(shouldAskSatisfaction('smalltalk')).toBe(true);
    expect(shouldAskSatisfaction('scenario')).toBe(false);
  });
});

describe('shouldAskAppSatisfaction — 랜딧 소감(별점 유도)', () => {
  const secondDay = { activeToday: true, totalActiveDays: 2 };

  it('시나리오 대화를 막 마쳤고 서버 기준 두 번째 완료일이면 묻는다', () => {
    markTalkCompleted('scenario');
    recordSatisfactionAnswer('scenario', 'good');

    expect(shouldAskAppSatisfaction(secondDay)).toBe(true);
  });

  it('첫 완료일이면(totalActiveDays 1) 묻지 않는다', () => {
    markTalkCompleted('scenario');

    expect(
      shouldAskAppSatisfaction({ activeToday: true, totalActiveDays: 1 }),
    ).toBe(false);
  });

  it('오늘 완료한 게 아니면 묻지 않는다 — 며칠 전 두 번째를 마친 사람이 오늘 홈만 연 경우', () => {
    markTalkCompleted('scenario');

    expect(
      shouldAskAppSatisfaction({ activeToday: false, totalActiveDays: 3 }),
    ).toBe(false);
  });

  it('막 마친 차례(pending)가 아니면 묻지 않는다', () => {
    expect(shouldAskAppSatisfaction(secondDay)).toBe(false);
  });

  it('첫 소감에서 아쉬웠다고 한 사람에겐 묻지 않는다', () => {
    markTalkCompleted('scenario');
    recordSatisfactionAnswer('scenario', 'bad');

    expect(shouldAskAppSatisfaction(secondDay)).toBe(false);
  });

  it('첫 소감을 닫기만 한 사람에겐 묻는다', () => {
    markTalkCompleted('scenario');
    recordSatisfactionAnswer('scenario', 'dismiss');

    expect(shouldAskAppSatisfaction(secondDay)).toBe(true);
  });

  it('한 번 답했으면 다시 묻지 않는다', () => {
    markTalkCompleted('scenario');
    recordSatisfactionAnswer('app', 'dismiss');

    expect(shouldAskAppSatisfaction(secondDay)).toBe(false);
  });

  it('시트를 하나 띄워 차례를 소비하면 같은 완료로는 또 묻지 않는다', () => {
    // Given 이번 완료로 첫 소감 시트가 이미 떴다
    markTalkCompleted('scenario');
    consumeTalkPending('scenario');

    // Then 다음 완료 전까지 랜딧 소감도 뜨지 않는다
    expect(shouldAskAppSatisfaction(secondDay)).toBe(false);

    // When 다시 마치면 차례가 돌아온다
    markTalkCompleted('scenario');
    expect(shouldAskAppSatisfaction(secondDay)).toBe(true);
  });
});

describe('mayAskAppSatisfaction — 스트릭을 조회할 필요가 있는지 로컬만으로 거른다', () => {
  it('막 마쳤고 첫 소감이 bad가 아니고 아직 안 물었으면 조회할 가치가 있다', () => {
    markTalkCompleted('scenario');

    expect(mayAskAppSatisfaction()).toBe(true);
  });

  it('첫 소감이 bad면 조회할 필요가 없다', () => {
    markTalkCompleted('scenario');
    recordSatisfactionAnswer('scenario', 'bad');

    expect(mayAskAppSatisfaction()).toBe(false);
  });
});

describe('readSatisfactionAnswer', () => {
  it('답한 적 없으면 null이다', () => {
    expect(readSatisfactionAnswer('scenario')).toBeNull();
  });

  it('답을 남기면 그 값을 돌려준다 — 뒤에 올 리뷰 요청이 이 값으로 대상을 고른다', () => {
    recordSatisfactionAnswer('scenario', 'bad');

    expect(readSatisfactionAnswer('scenario')).toBe('bad');
  });
});

describe('저장 형식', () => {
  it('프롬프트 기록은 키 하나에 JSON으로 모아 둔다', () => {
    markTalkCompleted('scenario');
    recordSatisfactionAnswer('scenario', 'good');

    expect(JSON.parse(localStorage.getItem(PROMPT_RECORD_KEY)!)).toEqual({
      'satisfaction:scenario': { pending: true, answer: 'good' },
    });
  });

  it('저장된 값이 깨져 있어도 없는 것으로 보고 넘어간다', () => {
    localStorage.setItem(PROMPT_RECORD_KEY, '{not json');

    expect(shouldAskSatisfaction('scenario')).toBe(false);
    expect(() => markTalkCompleted('scenario')).not.toThrow();
    expect(shouldAskSatisfaction('scenario')).toBe(true);
  });
});
