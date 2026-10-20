// prompt-record — 대화 종류별로 "물을 차례"와 "답한 기록"을 기기에 남기는 계약 검증
// @vitest-environment jsdom
import { beforeEach, describe, expect, it } from 'vitest';

import { getDeviceToday } from '@/shared/lib/device-today';

import {
  consumeAllPending,
  markExpressionCompleted,
  markReviewShown,
  markTalkCompleted,
  peekReviewAttempt,
  PROMPT_RECORD_KEY,
  readReviewAttempt,
  readSatisfactionAnswer,
  recordSatisfactionAnswer,
  resolveReviewTrigger,
  shouldAskReview,
  shouldAskSatisfaction,
} from './prompt-record';

beforeEach(() => localStorage.clear());

// 기록의 날짜 칸을 n일 전으로 돌린다 — 시간 흐름을 흉내 내는 유일한 통로
const daysAgo = (n: number) =>
  getDeviceToday(new Date(Date.now() - n * 24 * 60 * 60 * 1000));

const rewind = (
  key: string,
  field: 'pendingOn' | 'answeredOn' | 'shownOn',
  n: number,
) => {
  const all = JSON.parse(localStorage.getItem(PROMPT_RECORD_KEY)!);
  all[key][field] = daysAgo(n);
  localStorage.setItem(PROMPT_RECORD_KEY, JSON.stringify(all));
};

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

  it('어제 마치고 홈에 안 들렀으면 오늘 소감을 묻지 않는다 — 방금 마친 게 아니다', () => {
    markTalkCompleted('scenario');
    rewind('satisfaction:scenario', 'pendingOn', 1);

    expect(shouldAskSatisfaction('scenario')).toBe(false);
  });
});

describe('shouldAskReview — 리뷰 요청', () => {
  // 좋았다고 답하고 그 시트를 닫은 상태(차례 소비됨)
  const answeredGood = (talk: 'scenario' | 'smalltalk' = 'scenario') => {
    markTalkCompleted(talk);
    recordSatisfactionAnswer(talk, 'good');
    consumeAllPending();
  };

  it('좋았다고 한 사람이 같은 날 대화를 하나 더 마치면 청한다 — 다른 날까지 기다리지 않는다', () => {
    answeredGood();

    markTalkCompleted('scenario');

    expect(shouldAskReview()).toBe(true);
  });

  it('대화 종류는 가리지 않는다 — 시나리오에서 좋았다고 하고 스몰톡을 마쳐도 청한다', () => {
    answeredGood('scenario');
    markTalkCompleted('smalltalk');

    expect(shouldAskReview()).toBe(true);
  });

  it('표현 학습을 마치고 와도 청한다', () => {
    answeredGood();
    markExpressionCompleted();

    expect(shouldAskReview()).toBe(true);
  });

  it('소감 시트가 뜬 그 홈 진입에서는 청하지 않는다 — 차례가 소비돼 막 마친 게 없다', () => {
    // Given 대화를 마치고 소감 시트에 좋았다고 답했다(시트가 차례를 소비한다)
    answeredGood();

    // Then 새로 마친 게 없으니 리뷰 시트가 이어 뜨지 않는다
    expect(shouldAskReview()).toBe(false);
  });

  it('어제 마치고 홈에 안 들른 차례로는 청하지 않는다', () => {
    answeredGood();
    markTalkCompleted('scenario');
    rewind('satisfaction:scenario', 'pendingOn', 1);

    expect(shouldAskReview()).toBe(false);
  });

  it.each([['bad'], ['dismiss']] as const)(
    '좋았다고 하지 않은 사람에게는(%s) 청하지 않는다',
    (answer) => {
      markTalkCompleted('scenario');
      recordSatisfactionAnswer('scenario', answer);
      consumeAllPending();
      markTalkCompleted('scenario');

      expect(shouldAskReview()).toBe(false);
    },
  );

  it('하루에 한 번만 — 오늘 이미 띄웠으면 또 마쳐도 청하지 않는다', () => {
    // Given 오늘 리뷰 시트를 한 번 띄웠고 닫았다
    answeredGood();
    markTalkCompleted('scenario');
    markReviewShown();
    recordSatisfactionAnswer('review', 'dismiss');

    // When 같은 날 대화를 또 마치면
    markTalkCompleted('scenario');

    // Then 오늘은 더 청하지 않는다
    expect(shouldAskReview()).toBe(false);
  });

  describe('닫은 뒤 재요청 — 닫은 날부터 2일, 4일, 6일을 최소로 쉰다', () => {
    // 리뷰 시트를 n번 띄우고 매번 닫았고, 마지막으로 닫은 게 closedDaysAgo일 전인 상태
    const closedTimes = (n: number, closedDaysAgo: number) => {
      answeredGood();
      for (let i = 0; i < n; i += 1) {
        markReviewShown();
        consumeAllPending();
        recordSatisfactionAnswer('review', 'dismiss');
        rewind('satisfaction:review', 'shownOn', n - i);
      }
      rewind('satisfaction:review', 'answeredOn', closedDaysAgo);
      rewind('satisfaction:review', 'shownOn', closedDaysAgo);
      markTalkCompleted('scenario');
    };

    it.each([
      [1, 1, false],
      [1, 2, true],
      [2, 3, false],
      [2, 4, true],
      [3, 5, false],
      [3, 6, true],
    ])('%i번 닫았고 %i일 지났으면 청하는가 → %s', (times, days, expected) => {
      closedTimes(times, days);

      expect(shouldAskReview()).toBe(expected);
    });

    it('간격은 최소 쉼이다 — 한 번 닫고 6일 뒤에 와도 1차 재요청으로 청한다', () => {
      closedTimes(1, 6);

      expect(shouldAskReview()).toBe(true);
      expect(readReviewAttempt()).toBe(1);
    });

    it('답 없이 뜨기만 했으면 띄운 날부터 쉰다 — 뜨자마자 앱을 꺼도 다음 날 바로 또 뜨지 않는다', () => {
      answeredGood();
      markTalkCompleted('scenario');
      markReviewShown();

      rewind('satisfaction:review', 'shownOn', 1);
      markTalkCompleted('scenario');
      expect(shouldAskReview()).toBe(false);

      rewind('satisfaction:review', 'shownOn', 2);
      expect(shouldAskReview()).toBe(true);
    });

    it('네 번(처음 1 + 재요청 3) 띄웠으면 아무리 지나도 청하지 않는다', () => {
      closedTimes(4, 30);

      expect(shouldAskReview()).toBe(false);
    });

    it('배포 전에 한 번 닫은 기록(attempt 없음)은 1번 띄운 것으로 본다', () => {
      // Given 옛 코드가 남긴 기록 — answer와 answeredOn만 있다
      answeredGood();
      localStorage.setItem(
        PROMPT_RECORD_KEY,
        JSON.stringify({
          ...JSON.parse(localStorage.getItem(PROMPT_RECORD_KEY)!),
          'satisfaction:review': { answer: 'dismiss', answeredOn: daysAgo(2) },
        }),
      );
      markTalkCompleted('scenario');

      // Then 2일이 지났으니 1차 재요청으로 청한다
      expect(shouldAskReview()).toBe(true);
      expect(readReviewAttempt()).toBe(1);
    });
  });

  it('이미 남겼다고 하면 아무리 지나도 다시 청하지 않는다', () => {
    answeredGood();
    markTalkCompleted('scenario');
    markReviewShown();
    recordSatisfactionAnswer('review', 'already_done');
    rewind('satisfaction:review', 'answeredOn', 30);
    rewind('satisfaction:review', 'shownOn', 30);
    markTalkCompleted('scenario');

    expect(shouldAskReview()).toBe(false);
  });

  it('스토어로 간 것은 끝이 아니다 — 닫은 것과 같이 2일 뒤 다시 청한다', () => {
    // Given 리뷰 남기러 가기를 눌러 스토어로 갔다 (썼는지는 모른다)
    answeredGood();
    markTalkCompleted('scenario');
    markReviewShown();
    recordSatisfactionAnswer('review', 'good');

    // When 하루 뒤 대화를 마치면 아직이고
    rewind('satisfaction:review', 'answeredOn', 1);
    rewind('satisfaction:review', 'shownOn', 1);
    markTalkCompleted('scenario');
    expect(shouldAskReview()).toBe(false);

    // Then 이틀 뒤면 다시 청한다 — 썼다면 「이미 남겼어요」로 끝낼 수 있다
    rewind('satisfaction:review', 'answeredOn', 2);
    rewind('satisfaction:review', 'shownOn', 2);
    expect(shouldAskReview()).toBe(true);
  });
});

describe('markReviewShown · readReviewAttempt', () => {
  it('다른 날 띄울 때마다 횟수가 하나씩 는다 — 처음은 1', () => {
    expect(readReviewAttempt()).toBe(0);

    markReviewShown();
    expect(readReviewAttempt()).toBe(1);

    rewind('satisfaction:review', 'shownOn', 1);
    markReviewShown();
    expect(readReviewAttempt()).toBe(2);
  });

  it('같은 날 두 번 불려도 한 번으로 센다 — 개발 모드의 이펙트 이중 실행에 횟수가 두 배로 늘지 않게', () => {
    expect(markReviewShown()).toBe(true);
    expect(markReviewShown()).toBe(false);

    expect(readReviewAttempt()).toBe(1);
  });

  it('peekReviewAttempt — 오늘 이미 띄웠으면 그 횟수, 아니면 하나 더', () => {
    expect(peekReviewAttempt()).toBe(1);

    markReviewShown();
    expect(peekReviewAttempt()).toBe(1);

    rewind('satisfaction:review', 'shownOn', 1);
    expect(peekReviewAttempt()).toBe(2);
  });

  it('띄운 것만 남긴다 — 차례 소비는 부르는 쪽 몫이라 여기서는 건드리지 않는다', () => {
    markTalkCompleted('scenario');

    markReviewShown();

    expect(shouldAskSatisfaction('scenario')).toBe(true);
  });
});

describe('resolveReviewTrigger — 무엇을 마치고 와서 떴는가', () => {
  it('대화를 마쳤으면 talk', () => {
    markTalkCompleted('smalltalk');

    expect(resolveReviewTrigger()).toBe('talk');
  });

  it('표현 학습만 마쳤으면 expression', () => {
    markExpressionCompleted();

    expect(resolveReviewTrigger()).toBe('expression');
  });

  it('둘 다 마쳤으면 대화를 앞세운다', () => {
    markExpressionCompleted();
    markTalkCompleted('scenario');

    expect(resolveReviewTrigger()).toBe('talk');
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
        // 마친 날 — 오늘 마친 차례만 친다
        pendingOn: expect.stringMatching(/^\d{4}-\d{2}-\d{2}$/),
        // 답한 날 — 재요청 간격을 세는 기준
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
