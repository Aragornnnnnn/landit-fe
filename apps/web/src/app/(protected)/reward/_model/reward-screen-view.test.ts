// 환급 화면이 무엇을 그릴지의 계약 테스트
import { describe, expect, it } from 'vitest';

import {
  endedRewardView,
  rewardActivity,
  rewardCycle,
  rewardToday,
  rewardView,
} from '@/features/reward/model/reward.fixture';

import { rewardScreenViewOf, rewardViewedPropsOf } from './reward-screen-view';

const base = {
  reward: null,
  error: null,
  loaded: false,
  fetching: false,
  invited: false,
  settled: false,
};
const failure = new Error('네트워크 오류');

describe('rewardScreenViewOf', () => {
  it('참여자에게는 환급 기록을 보여 준다', () => {
    const reward = rewardView();

    expect(rewardScreenViewOf({ ...base, reward, loaded: true })).toEqual({
      kind: 'record',
      reward,
    });
  });

  it('참여자는 다시 받기가 실패해도 가진 기록을 본다', () => {
    const view = rewardScreenViewOf({
      ...base,
      reward: rewardView(),
      loaded: true,
      error: failure,
    });

    expect(view.kind).toBe('record');
  });

  it('환급을 한 번도 받지 못했으면 다시 시도를 권한다', () => {
    expect(rewardScreenViewOf({ ...base, error: failure })).toEqual({
      kind: 'error',
      error: failure,
    });
  });

  it('권할 사람에게는 환급 소개를 보여 준다', () => {
    const view = rewardScreenViewOf({
      ...base,
      loaded: true,
      invited: true,
      settled: true,
    });

    expect(view.kind).toBe('intro');
  });

  it('권할 사람은 다시 받기가 실패해도 소개를 본다', () => {
    const view = rewardScreenViewOf({
      ...base,
      loaded: true,
      invited: true,
      settled: true,
      error: failure,
    });

    expect(view.kind).toBe('intro');
  });

  it('환급과 상관없는 사람은 내보낸다', () => {
    expect(
      rewardScreenViewOf({ ...base, loaded: true, settled: true }).kind,
    ).toBe('outsider');
  });

  it('환급을 다시 받는 중이면 상관없는 사람으로 단정하지 않고 기다린다', () => {
    // given — 방금 결제했다. 받아 둔 답은 결제 전의 것이다
    const view = rewardScreenViewOf({
      ...base,
      loaded: true,
      settled: true,
      fetching: true,
    });

    expect(view.kind).toBe('loading');
  });

  it('아직 모르면 기다린다', () => {
    expect(rewardScreenViewOf(base).kind).toBe('loading');
  });
});

describe('rewardViewedPropsOf', () => {
  const record = (reward: ReturnType<typeof rewardView>) =>
    rewardViewedPropsOf({ kind: 'record', reward });
  const active = (
    balanceWon: number,
    earnedWon: number,
    patch: Parameters<typeof rewardView>[0] = {},
  ) =>
    rewardView({
      current: rewardCycle({ balanceWon }),
      today: rewardToday({
        earnedWon,
        activities: [rewardActivity('SCENARIO')],
      }),
      ...patch,
    });

  it('환급 소개는 금액 없이 intro로 찍는다', () => {
    expect(rewardViewedPropsOf({ kind: 'intro' })).toEqual({ status: 'intro' });
  });

  it.each([
    ['받는 중', { kind: 'loading' } as const],
    ['내보내는 중', { kind: 'outsider' } as const],
    ['오류', { kind: 'error', error: new Error('x') } as const],
  ])('%s이면 찍지 않는다', (_case, view) => {
    expect(rewardViewedPropsOf(view)).toBeNull();
  });

  it('오늘 받은 게 있으면 kept다', () => {
    expect(record(active(2015, 133))).toEqual({
      status: 'kept',
      balance_won: 2015,
    });
  });

  it('쌓인 게 있는데 오늘이 아직이면 at_risk다', () => {
    expect(record(active(1882, 0))).toEqual({
      status: 'at_risk',
      balance_won: 1882,
    });
  });

  it('쌓인 것도 오늘 받은 것도 없으면 idle이다', () => {
    expect(record(active(0, 0))).toEqual({ status: 'idle', balance_won: 0 });
  });

  it('어제 쉬어 0원이 됐고 오늘이 아직이면 reset이다', () => {
    expect(record(active(0, 0, { lostYesterdayWon: 1550 }))).toEqual({
      status: 'reset',
      balance_won: 0,
    });
  });

  it('어제 쉬었어도 오늘 다시 받았으면 kept다', () => {
    expect(record(active(111, 111, { lostYesterdayWon: 1550 }))?.status).toBe(
      'kept',
    );
  });

  it('기간이 끝났으면 쌓는 금액 대신 돌려받을 금액과 함께 ended다', () => {
    expect(record(endedRewardView(31_920))).toEqual({
      status: 'ended',
      pending_refund_won: 31_920,
    });
  });

  it('끝났고 돌려받을 금액이 없어도 0원으로 싣는다 — 다시 시작을 권하는 화면이다', () => {
    expect(record(endedRewardView(0))).toEqual({
      status: 'ended',
      pending_refund_won: 0,
    });
  });

  it('결제 확인 중이면 금액 없이 pending이다', () => {
    expect(
      record(
        rewardView({
          state: 'PENDING',
          current: null,
          today: null,
          remainingDays: null,
        }),
      ),
    ).toEqual({ status: 'pending' });
  });

  it('검토 중이면 도는 회차의 금액과 함께 review다', () => {
    expect(
      record(
        rewardView({
          state: 'REVIEW',
          current: rewardCycle({ balanceWon: 1882 }),
          today: null,
        }),
      ),
    ).toEqual({ status: 'review', balance_won: 1882 });
  });
});
