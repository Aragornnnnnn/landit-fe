// 대화를 끝낸 순간 받은 금액을 보여 줄지 정하는 규칙의 계약 테스트
import { describe, expect, it } from 'vitest';

import {
  completionEarnOf,
  earnBaseOf,
  expressionsEarnOf,
} from './completion-earn';
import {
  rewardActivity,
  rewardReceipt,
  rewardToday,
  rewardView,
} from './reward.fixture';

const done = (activityType: 'SCENARIO' | 'SMALLTALK') =>
  rewardActivity(activityType, {
    earnedWon: 111,
    completed: true,
    completedCount: 1,
    remainingWon: 0,
  });

// 시나리오만 끝낸 오늘
const afterScenario = rewardView({
  today: rewardToday({
    earnedWon: 111,
    activities: [
      done('SCENARIO'),
      rewardActivity('EXPRESSION'),
      rewardActivity('SMALLTALK'),
    ],
  }),
});

describe('earnBaseOf', () => {
  it('오늘 그 대화가 아직이면 이번 완료로 받을 수 있다고 적어 둔다', () => {
    expect(earnBaseOf(rewardView(), 'SCENARIO')).toEqual({
      date: '2026-10-10',
      activityType: 'SCENARIO',
    });
  });

  it('오늘 같은 종류를 이미 끝냈으면 적지 않는다', () => {
    expect(earnBaseOf(afterScenario, 'SCENARIO')).toBeNull();
  });

  it('쌓는 중이 아니면 적지 않는다', () => {
    expect(
      earnBaseOf(rewardView({ state: 'REVIEW', today: null }), 'SCENARIO'),
    ).toBeNull();
  });
});

describe('completionEarnOf', () => {
  const base = { date: '2026-10-10', activityType: 'SCENARIO' } as const;

  it('이번 완료로 받은 금액과 오늘 남은 몫, 오늘 칸들을 알려 준다', () => {
    const earn = completionEarnOf(afterScenario, base);

    expect(earn?.activityType).toBe('SCENARIO');
    expect(earn?.earnedWon).toBe(111);
    expect(earn?.guide).toBe('오늘 221원 더 받을 수 있어요');
    expect(earn?.slots.map((slot) => slot.progress)).toEqual([1, 0, 0]);
  });

  it('오늘을 다 채웠으면 다 채웠다고 말한다', () => {
    // given — 스몰톡까지 끝내 오늘 몫이 다 찼다
    const full = rewardView({
      today: rewardToday({
        earnedWon: 332,
        fullyAchieved: true,
        activities: [
          done('SCENARIO'),
          rewardActivity('EXPRESSION', {
            earnedWon: 110,
            completed: true,
            completedCount: 4,
            remainingWon: 0,
          }),
          done('SMALLTALK'),
        ],
      }),
    });

    const earn = completionEarnOf(full, {
      date: '2026-10-10',
      activityType: 'SMALLTALK',
    });

    expect(earn?.earnedWon).toBe(111);
    expect(earn?.guide).toBe('오늘 몫을 다 채웠어요');
  });

  it('적어 둔 것이 없으면 보여 줄 것이 없다', () => {
    expect(completionEarnOf(afterScenario, null)).toBeNull();
  });

  it('새 금액이 아직 오지 않았으면 보여 줄 것이 없다', () => {
    // given — 받아 둔 답이 완료 전의 것이다
    expect(completionEarnOf(rewardView(), base)).toBeNull();
  });

  it('그사이 날이 바뀌었으면 보여 줄 것이 없다', () => {
    expect(
      completionEarnOf(afterScenario, { ...base, date: '2026-10-09' }),
    ).toBeNull();
  });
});

describe('expressionsEarnOf', () => {
  const expressions = (completedCount: number, earnedWon: number) =>
    rewardActivity('EXPRESSION', {
      earnedWon,
      completedCount,
      completed: completedCount === 4,
      remainingWon: 110 - earnedWon,
    });
  // 시나리오를 끝낸 뒤 마지막 표현까지 끝낸 영수증
  const last = rewardReceipt({
    activityType: 'EXPRESSION',
    earnedWon: 77,
    todayEarnedWon: 221,
    activities: [
      done('SCENARIO'),
      expressions(4, 110),
      rewardActivity('SMALLTALK'),
    ],
  });

  it('마지막 표현을 끝내 받았으면 그 금액과 표현 개수, 오늘 남은 몫을 알려 준다', () => {
    const earn = expressionsEarnOf(last);

    expect(earn?.activityType).toBe('EXPRESSION');
    expect(earn?.earnedWon).toBe(77);
    expect(earn?.expressionCount).toBe(4);
    expect(earn?.guide).toBe('오늘 111원 더 받을 수 있어요');
    expect(earn?.slots.map((slot) => slot.progress)).toEqual([1, 1, 0]);
  });

  it('표현이 아직 남았으면 보여 줄 것이 없다 — 하나마다 뜨는 알림이 알린다', () => {
    expect(
      expressionsEarnOf(
        rewardReceipt({
          activityType: 'EXPRESSION',
          earnedWon: 11,
          activities: [expressions(2, 22)],
        }),
      ),
    ).toBeNull();
  });

  it('받은 금액이 없으면 보여 줄 것이 없다', () => {
    expect(
      expressionsEarnOf({
        ...last,
        status: 'NO_ADDITIONAL_REWARD',
        earnedWon: 0,
      }),
    ).toBeNull();
  });

  it('오늘 받을 수 있는 금액을 모르면 얼마인지는 말하지 않는다', () => {
    expect(expressionsEarnOf({ ...last, todayMaximumWon: null })?.guide).toBe(
      '오늘 더 받을 수 있어요',
    );
  });
});
