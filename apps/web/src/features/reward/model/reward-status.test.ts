// 환급 히어로 문구와 오늘 세 칸의 계약 테스트
import { describe, expect, it } from 'vitest';

import type { RewardView } from '../api/reward';
import {
  atRiskOf,
  balanceOf,
  participantOf,
  rewardHeroOf,
  todaySlotsOf,
} from './reward-status';
import {
  endedRewardView,
  rewardActivity,
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

  it.each(['ACTIVE', 'ENDED', 'PENDING', 'REVIEW'] as const)(
    '%s 국면은 참여자다',
    (state) => {
      const view = rewardView({ state });

      expect(participantOf(view)).toBe(view);
    },
  );
});

describe('balanceOf', () => {
  it('도는 회차에 쌓인 금액을 준다', () => {
    expect(balanceOf(rewardView())).toBe(12300);
  });

  it('도는 회차가 없으면 금액이 없다', () => {
    expect(balanceOf(endedRewardView(31920))).toBe(null);
  });
});

describe('atRiskOf', () => {
  it('쌓인 게 있는데 오늘이 아직이면 걸려 있다', () => {
    expect(atRiskOf(rewardView())).toBe(true);
  });

  it('오늘 하나라도 했으면 지켜졌다', () => {
    const view = rewardView({ today: rewardToday({ earnedWon: 11 }) });

    expect(atRiskOf(view)).toBe(false);
  });

  it('쌓인 게 없으면 잃을 것도 없다', () => {
    const view = rewardView({ current: rewardCycle({ balanceWon: 0 }) });

    expect(atRiskOf(view)).toBe(false);
  });

  it('검토 중에는 오늘이 오지 않아도 걸려 있다고 보지 않는다', () => {
    const view = rewardView({ state: 'REVIEW', today: null });

    expect(atRiskOf(view)).toBe(false);
  });
});

describe('rewardHeroOf — 쌓는 중', () => {
  it('쌓인 금액을 꼬리표와 함께 말한다', () => {
    expect(rewardHeroOf(rewardView())).toMatchObject({
      label: '쌓인 환급액',
      amountWon: 12300,
      title: null,
    });
  });

  it('오늘이 아직이면 안 하면 사라진다는 걸 숨기지 않는다', () => {
    expect(rewardHeroOf(rewardView()).guide).toBe(
      '오늘 하나도 안 하면 12,300원이 사라져요',
    );
  });

  it('쌓인 게 없고 오늘도 아직이면 시작을 권한다', () => {
    const view = rewardView({ current: rewardCycle({ balanceWon: 0 }) });

    expect(rewardHeroOf(view).guide).toBe('오늘 대화 하나로 쌓기 시작해요');
  });

  it('어제 쉬어서 사라졌으면 얼마가 사라졌는지 숨기지 않는다', () => {
    const view = rewardView({
      current: rewardCycle({ balanceWon: 0 }),
      lostYesterdayWon: 1107,
    });

    expect(rewardHeroOf(view).guide).toBe(
      '어제 쉬어서 1,107원이 사라졌어요\n오늘부터 다시 쌓을 수 있어요',
    );
  });

  it('오늘 일부를 채웠으면 남은 금액을 말한다', () => {
    const view = rewardView({ today: rewardToday({ earnedWon: 111 }) });

    expect(rewardHeroOf(view).guide).toBe('오늘 221원 더 받을 수 있어요');
  });

  it('오늘 한도를 모르면 남은 금액을 지어내지 않는다', () => {
    const view = rewardView({
      today: rewardToday({ earnedWon: 111, maximumWon: null }),
    });

    expect(rewardHeroOf(view).guide).toBe('오늘 더 받을 수 있어요');
  });

  it('오늘을 다 채웠으면 그렇게 말한다', () => {
    const view = rewardView({
      today: rewardToday({ earnedWon: 332, fullyAchieved: true }),
    });

    expect(rewardHeroOf(view).guide).toBe('오늘 몫을 다 채웠어요');
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

    expect(hero).toMatchObject({ label: '쌓인 환급액', amountWon: 12300 });
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

describe('todaySlotsOf', () => {
  it('학습 순서대로 놓고 표현은 끝낸 개수만큼 채운다', () => {
    // given — 서버는 순서를 약속하지 않는다
    const slots = todaySlotsOf([
      rewardActivity('SMALLTALK'),
      rewardActivity('EXPRESSION', {
        earnedWon: 22,
        completedCount: 2,
        remainingWon: 88,
      }),
      rewardActivity('SCENARIO', {
        earnedWon: 111,
        completed: true,
        completedCount: 1,
        remainingWon: 0,
      }),
    ]);

    expect(slots.map((slot) => [slot.label, slot.progress])).toEqual([
      ['시나리오', 1],
      ['표현', 0.5],
      ['스몰톡', 0],
    ]);
  });

  it('더 받을 금액은 서버가 준 값을 그대로 쓴다', () => {
    // given — 표현의 다음 한 개 몫은 11원이지만 다 끝내면 88원을 더 받는다
    const [slot] = todaySlotsOf([
      rewardActivity('EXPRESSION', {
        earnedWon: 22,
        completedCount: 2,
        nextEarnableWon: 11,
        remainingWon: 88,
      }),
    ]);

    expect(slot).toMatchObject({
      earnedWon: 22,
      remainingWon: 88,
      countLabel: '2/4',
    });
  });

  it('하나짜리 활동은 개수를 말하지 않는다', () => {
    const [slot] = todaySlotsOf([rewardActivity('SMALLTALK')]);

    expect(slot.countLabel).toBe(null);
  });

  it('그날 대상이 없는 활동은 칸을 만들지 않는다', () => {
    // given — 배정된 표현이 없는 날. 표현 몫은 두 대화가 나눠 갖는다
    const slots = todaySlotsOf([
      rewardActivity('SCENARIO', { remainingWon: 166 }),
      rewardActivity('EXPRESSION', {
        completed: true,
        targetCount: 0,
        remainingWon: 0,
      }),
      rewardActivity('SMALLTALK', { remainingWon: 166 }),
    ]);

    expect(slots.map((slot) => slot.label)).toEqual(['시나리오', '스몰톡']);
  });
});
