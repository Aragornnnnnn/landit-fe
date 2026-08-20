// prompt-record — 대화 종류별로 "물을 차례"와 "답한 기록"을 기기에 남기는 계약 검증
import { beforeEach, describe, expect, it } from 'vitest';

import {
  consumeAllTalkPending,
  markTalkCompleted,
  mayAskReview,
  PROMPT_RECORD_KEY,
  readSatisfactionAnswer,
  recordSatisfactionAnswer,
  shouldAskReview,
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

describe('shouldAskReview — 리뷰 요청', () => {
  const anotherDay = { activeToday: true, totalActiveDays: 2 };

  // 좋았다고 답한 게 어제였던 상태로 만든다 — 리뷰는 답한 날과 다른 날에만 청한다
  const answeredGoodYesterday = (
    talk: 'scenario' | 'smalltalk' = 'scenario',
  ) => {
    markTalkCompleted(talk);
    recordSatisfactionAnswer(talk, 'good');
    const all = JSON.parse(localStorage.getItem(PROMPT_RECORD_KEY)!);
    all[`satisfaction:${talk}`].answeredOn = '2000-01-01';
    localStorage.setItem(PROMPT_RECORD_KEY, JSON.stringify(all));
    consumeAllTalkPending();
  };

  // 좋았다고 했던 사람이 다른 날 다시 와서 대화를 마친 상태
  const cameBackAfterGood = (talk: 'scenario' | 'smalltalk' = 'scenario') => {
    answeredGoodYesterday(talk);
    markTalkCompleted(talk);
  };

  it('좋았다고 했던 사람이 다른 날 또 대화를 마쳤으면 청한다', () => {
    cameBackAfterGood();

    expect(shouldAskReview(anotherDay)).toBe(true);
  });

  it('대화 종류는 가리지 않는다 — 시나리오에서 좋았다고 하고 스몰톡을 마쳐도 청한다', () => {
    answeredGoodYesterday('scenario');
    markTalkCompleted('smalltalk');

    expect(shouldAskReview(anotherDay)).toBe(true);
  });

  it('첫 완료일이면(totalActiveDays 1) 청하지 않는다 — 같은 날 두 번째 대화도 여기 걸린다', () => {
    cameBackAfterGood();

    expect(shouldAskReview({ activeToday: true, totalActiveDays: 1 })).toBe(
      false,
    );
  });

  it('오늘 완료한 게 아니면 청하지 않는다 — 며칠 전 대화한 사람이 오늘 홈만 연 경우', () => {
    cameBackAfterGood();

    expect(shouldAskReview({ activeToday: false, totalActiveDays: 3 })).toBe(
      false,
    );
  });

  it('막 마친 차례가 아니면 청하지 않는다', () => {
    answeredGoodYesterday();

    expect(shouldAskReview(anotherDay)).toBe(false);
  });

  it.each([['bad'], ['dismiss']] as const)(
    '좋았다고 하지 않은 사람에게는(%s) 청하지 않는다',
    (answer) => {
      markTalkCompleted('scenario');
      recordSatisfactionAnswer('scenario', answer);
      consumeAllTalkPending();
      markTalkCompleted('scenario');

      expect(shouldAskReview(anotherDay)).toBe(false);
    },
  );

  it('좋았다고 한 그날 또 대화해도 청하지 않는다 — 다른 날 다시 온 사람만 대상이다', () => {
    // Given 완료일이 이미 많이 쌓인 사람(배포 전부터 쓰던 유저)이 오늘 좋았다고 답했고
    markTalkCompleted('scenario');
    recordSatisfactionAnswer('scenario', 'good');
    consumeAllTalkPending();

    // When 같은 날 대화를 한 번 더 마치면
    markTalkCompleted('scenario');

    // Then 완료일 수는 조건을 넘지만(30일) 답한 날과 같은 날이라 청하지 않는다
    expect(shouldAskReview({ activeToday: true, totalActiveDays: 30 })).toBe(
      false,
    );
  });

  it('한 번 청했으면 다시 청하지 않는다', () => {
    cameBackAfterGood();
    recordSatisfactionAnswer('review', 'dismiss');

    expect(shouldAskReview(anotherDay)).toBe(false);
  });
});

describe('mayAskReview — 스트릭을 조회할 필요가 있는지 로컬만으로 거른다', () => {
  // 좋았다고 답한 게 어제였던 상태로 만든다 — 리뷰는 답한 날과 다른 날에만 청한다
  const answeredGoodYesterday = (
    talk: 'scenario' | 'smalltalk' = 'scenario',
  ) => {
    markTalkCompleted(talk);
    recordSatisfactionAnswer(talk, 'good');
    const all = JSON.parse(localStorage.getItem(PROMPT_RECORD_KEY)!);
    all[`satisfaction:${talk}`].answeredOn = '2000-01-01';
    localStorage.setItem(PROMPT_RECORD_KEY, JSON.stringify(all));
    consumeAllTalkPending();
  };

  it('막 마쳤고 어제 좋았다고 했고 아직 안 청했으면 조회할 가치가 있다', () => {
    answeredGoodYesterday();
    markTalkCompleted('scenario');

    expect(mayAskReview()).toBe(true);
  });

  it('좋았다고 한 적이 없으면 조회할 필요가 없다', () => {
    markTalkCompleted('scenario');
    recordSatisfactionAnswer('scenario', 'bad');
    consumeAllTalkPending();
    markTalkCompleted('scenario');

    expect(mayAskReview()).toBe(false);
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
      'satisfaction:scenario': {
        pending: true,
        answer: 'good',
        // 답한 날 — 리뷰를 다른 날에만 청하기 위한 값
        answeredOn: expect.stringMatching(/^\d{4}-\d{2}-\d{2}$/),
      },
    });
  });

  it('저장된 값이 깨져 있어도 없는 것으로 보고 넘어간다', () => {
    localStorage.setItem(PROMPT_RECORD_KEY, '{not json');

    expect(shouldAskSatisfaction('scenario')).toBe(false);
    expect(() => markTalkCompleted('scenario')).not.toThrow();
    expect(shouldAskSatisfaction('scenario')).toBe(true);
  });
});
