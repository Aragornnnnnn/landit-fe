// 환급 히어로 문구와 좁은 자리 요약의 계약 테스트
import { describe, expect, it } from 'vitest';

import type { RewardView } from '../api/reward';
import {
  badgeAmountOf,
  balanceOf,
  participantOf,
  restDaysOf,
  rewardBadgeOf,
  rewardHeroOf,
  todayLeftWonOf,
} from './reward-status';
import {
  closedRewardDay,
  earnedRewardToday,
  endedRewardView,
  rewardCycle,
  rewardToday,
  rewardView,
} from './reward.fixture';

describe('participantOf', () => {
  it('환급과 상관없는 사람은 참여자가 아니다', () => {
    expect(participantOf(rewardView({ state: 'NONE', current: null }))).toBe(
      null,
    );
  });

  it('모르는 국면이 오면 참여자로 보지 않는다', () => {
    // given — 서버가 국면을 늘렸거나 값을 빼고 보냈다
    const view = { ...rewardView(), state: 'PAUSED' } as unknown as RewardView;

    expect(participantOf(view)).toBe(null);
  });

  it.each(['ACTIVE', 'PENDING', 'REVIEW'] as const)(
    '%s 국면은 참여자다',
    (state) => {
      const view = rewardView({ state });

      expect(participantOf(view)).toBe(view);
    },
  );

  it('기간이 끝나도 돌려받을 금액이 남았으면 참여자다', () => {
    const view = endedRewardView(31920);

    expect(participantOf(view)).toBe(view);
  });

  it('기간이 끝나 돌려받을 금액도 없고 다시 살 수 있으면 참여자로 보지 않는다 — 환급 소개를 다시 권한다', () => {
    expect(participantOf(endedRewardView(0))).toBe(null);
  });

  it('검토 중인 금액이 남았으면 기간이 끝나도 참여자다', () => {
    const view = { ...endedRewardView(0), heldRefundWon: 5000 };

    expect(participantOf(view)).toBe(view);
  });

  it('돌려받을 금액이 없어도 아직 다시 살 수 없으면 참여자다', () => {
    const view = { ...endedRewardView(0), purchaseAvailable: false };

    expect(participantOf(view)).toBe(view);
  });
});

describe('balanceOf', () => {
  it('도는 회차에 쌓인 금액을 준다', () => {
    expect(balanceOf(rewardView())).toBe(4500);
  });

  it('도는 회차가 없으면 금액이 없다', () => {
    expect(balanceOf(endedRewardView(31920))).toBe(null);
  });
});

describe('rewardHeroOf — 쌓는 중', () => {
  it('쌓인 금액을 꼬리표와 함께 말한다', () => {
    expect(rewardHeroOf(rewardView())).toMatchObject({
      label: '쌓인 환급액',
      amountWon: 4500,
      title: null,
    });
  });

  it('오늘의 시나리오가 아직이면 하면 받을 금액을 말한다', () => {
    expect(rewardHeroOf(rewardView()).guide).toBe(
      '오늘의 시나리오를 하면 500원을 받아요',
    );
  });

  it('쌓인 금액이 있는데 오늘이 아직이어도 잃는다는 말은 하지 않는다', () => {
    // given — 쉰 날은 그날 몫만 없고 모은 금액은 그대로다
    const { guide } = rewardHeroOf(rewardView());

    expect(guide).not.toContain('사라');
    expect(guide).not.toContain('4,500원');
  });

  it('오늘 몫을 받았으면 받은 금액을 말한다', () => {
    const view = rewardView({ today: earnedRewardToday() });

    expect(rewardHeroOf(view).guide).toBe('오늘 500원을 받았어요');
  });

  it('오늘 한도가 오늘 값에 없으면 요약의 오늘 금액으로 말한다', () => {
    const view = rewardView({
      todayMaximumWon: 500,
      today: rewardToday({ maximumWon: null }),
    });

    expect(rewardHeroOf(view).guide).toBe(
      '오늘의 시나리오를 하면 500원을 받아요',
    );
  });
});

describe('rewardHeroOf — 그 밖의 국면', () => {
  it('끝난 사람에게는 돌려받을 금액을 말한다', () => {
    expect(rewardHeroOf(endedRewardView(31920))).toMatchObject({
      label: '돌려받을 금액',
      amountWon: 31920,
    });
  });

  it('끝났는데 돌려받을 금액이 없으면 신청을 권하지 않는다', () => {
    const hero = rewardHeroOf(endedRewardView(0));

    expect(hero.amountWon).toBe(0);
    expect(hero.guide).not.toContain('환급 신청');
  });

  it('결제를 확인하는 동안에는 금액 대신 확인 중이라고 말한다', () => {
    const view = rewardView({
      state: 'PENDING',
      current: null,
      today: null,
      remainingDays: null,
    });

    expect(rewardHeroOf(view)).toMatchObject({
      label: null,
      amountWon: null,
      title: '결제를 확인하고 있어요',
    });
  });

  it('검토 중에도 쌓인 금액은 그대로 보여 준다', () => {
    const hero = rewardHeroOf(rewardView({ state: 'REVIEW', today: null }));

    expect(hero).toMatchObject({ label: '쌓인 환급액', amountWon: 4500 });
    expect(hero.guide).toContain('쌓인 금액은 그대로 보관돼요');
  });

  it('기간을 마친 뒤 검토 중이면 보류된 금액을 보여 준다', () => {
    const view = rewardView({
      state: 'REVIEW',
      current: null,
      today: null,
      remainingDays: null,
      heldRefundWon: 31920,
    });

    expect(rewardHeroOf(view)).toMatchObject({
      label: '확인 중인 금액',
      amountWon: 31920,
    });
  });
});

describe('rewardBadgeOf', () => {
  it('쌓인 게 있어도 오늘의 시나리오가 아직이면 급하지 않게 남았다고만 알린다', () => {
    expect(rewardBadgeOf(rewardView())).toEqual({
      label: '쌓인 환급액',
      amountWon: 4500,
      note: '오늘의 시나리오가 남았어요',
      mood: 'idle',
    });
  });

  it('오늘 몫을 받았으면 받았다고 말한다', () => {
    const view = rewardView({ today: earnedRewardToday() });

    expect(rewardBadgeOf(view)).toMatchObject({
      note: '오늘 몫을 받았어요',
      mood: 'kept',
    });
  });

  it('쌓인 게 없고 오늘도 아직이면 0원으로 같은 말을 한다', () => {
    const view = rewardView({ current: rewardCycle({ balanceWon: 0 }) });

    expect(rewardBadgeOf(view)).toMatchObject({ amountWon: 0, mood: 'idle' });
  });

  it('기간을 마쳤으면 돌려받을 금액과 곧 신청할 수 있음을 말한다', () => {
    expect(rewardBadgeOf(endedRewardView(31920))).toEqual({
      label: '돌려받을 금액',
      amountWon: 31920,
      note: '곧 환급 신청할 수 있어요',
      mood: 'kept',
    });
  });

  it('끝났고 돌려받을 금액도 없으면 알릴 것이 없다', () => {
    expect(rewardBadgeOf(endedRewardView(0))).toBe(null);
  });

  it('결제를 확인하는 동안에는 금액 없이 확인 중이라고 말한다', () => {
    const view = rewardView({
      state: 'PENDING',
      current: null,
      today: null,
      remainingDays: null,
    });

    expect(rewardBadgeOf(view)).toEqual({
      label: '환급',
      amountWon: null,
      note: '결제를 확인하고 있어요',
      mood: 'kept',
    });
  });

  it('검토 중에는 금액을 그대로 두고 확인 중이라고 말한다', () => {
    const view = rewardView({ state: 'REVIEW', today: null });

    expect(rewardBadgeOf(view)).toMatchObject({
      amountWon: 4500,
      note: '결제 내역을 확인하고 있어요',
      mood: 'kept',
    });
  });
});

describe('badgeAmountOf', () => {
  it('금액을 원화로 적는다', () => {
    const badge = rewardBadgeOf(rewardView());

    expect(badge && badgeAmountOf(badge)).toBe('4,500원');
  });

  it('금액을 모르면 확인 중이라고 적는다', () => {
    const badge = rewardBadgeOf(
      rewardView({ state: 'PENDING', current: null, today: null }),
    );

    expect(badge && badgeAmountOf(badge)).toBe('확인 중');
  });
});

describe('restDaysOf', () => {
  const withDays = (...days: [string, boolean][]) =>
    rewardView({
      current: rewardCycle({
        days: days.map(([date, achieved]) => closedRewardDay(date, achieved)),
      }),
    });

  it('가장 최근에 마감된 날부터 거슬러 쉰 날을 센다', () => {
    const view = withDays(
      ['2026-10-06', false],
      ['2026-10-07', true],
      ['2026-10-08', false],
      ['2026-10-09', false],
    );

    expect(restDaysOf(view)).toBe(2);
  });

  it('어제 했으면 0이다', () => {
    expect(
      restDaysOf(withDays(['2026-10-08', false], ['2026-10-09', true])),
    ).toBe(0);
  });

  it('날짜가 뒤섞여 와도 날짜순으로 센다', () => {
    expect(
      restDaysOf(withDays(['2026-10-09', false], ['2026-10-08', true])),
    ).toBe(1);
  });

  it('지난 날이 없거나 도는 회차가 없으면 0이다', () => {
    expect(restDaysOf(rewardView())).toBe(0);
    expect(restDaysOf(endedRewardView(31_920))).toBe(0);
  });

  it('며칠째 쉬고 있으면 안내가 그 날수를 먼저 말한다', () => {
    const view = withDays(['2026-10-08', false], ['2026-10-09', false]);

    expect(rewardHeroOf(view).guide).toBe(
      '2일째 쉬고 있어요\n오늘의 시나리오를 하면 500원을 받아요',
    );
  });
});

describe('todayLeftWonOf', () => {
  it('쌓는 중인데 오늘의 시나리오가 아직이면 오늘 몫이다', () => {
    expect(todayLeftWonOf(rewardView({ todayMaximumWon: 500 }))).toBe(500);
  });

  it('오늘 몫을 받았으면 0이다', () => {
    expect(todayLeftWonOf(rewardView({ today: earnedRewardToday() }))).toBe(0);
  });

  it('쌓는 중이 아니거나 오늘이 오지 않았으면 0이다', () => {
    expect(todayLeftWonOf(endedRewardView(31_920))).toBe(0);
    expect(todayLeftWonOf(rewardView({ today: null }))).toBe(0);
  });
});
