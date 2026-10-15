// 환급 소개 화면 문구의 갈림길 — 오늘 대화 전과 후, 놓친 환급액이 있는지
import { describe, expect, it } from 'vitest';

import { rewardOfferOf } from '@/features/reward/model/refund-offer';

import { missedCopyOf, rewardIntroCopyOf } from './reward-intro-copy';

const offer = rewardOfferOf(50_000);

describe('rewardIntroCopyOf', () => {
  it('오늘의 시나리오를 아직 안 했으면 100일의 최대 금액을 크게 말하고 아래 한 줄은 규칙에 맡긴다', () => {
    expect(rewardIntroCopyOf(offer, false)).toEqual({
      eyebrow: '100일 동안 매일 대화하면',
      amount: '최대 50,000원',
      caption: null,
      cta: '100일 환급 챌린지 시작하기',
    });
  });

  it('오늘의 시나리오를 이미 했어도 최대 금액을 크게 말하고 지금 시작하면 오늘 몫이 바로 적립된다고 덧붙인다', () => {
    expect(rewardIntroCopyOf(offer, true)).toEqual({
      eyebrow: '100일 동안 매일 대화하면',
      amount: '최대 50,000원',
      caption: {
        lead: '지금 시작하면 바로 ',
        strong: '500원',
        tail: '이 쌓여요',
      },
      cta: '100일 환급 챌린지 시작하기',
    });
  });

  it('가격이 다른 이용권이면 금액이 따라 바뀐다', () => {
    expect(rewardIntroCopyOf(rewardOfferOf(30_000), false).amount).toBe(
      '최대 30,000원',
    );
  });
});

describe('missedCopyOf', () => {
  const missed = {
    pastDays: 32,
    missedWon: 16_000,
    dailyWon: 500,
    today: '2026-10-15',
  };

  it('놓친 날수와 금액을 말하고, 오늘 아직이면 챌린지를 시작해 첫 몫을 받으라고 권한다', () => {
    expect(missedCopyOf({ ...missed, talkedToday: false })).toEqual({
      eyebrow: '32일 동안 놓친 환급액',
      amount: '16,000원',
      box: {
        lead: '챌린지를 시작하고 첫 ',
        strong: '500원',
        tail: '을 받아봐요',
      },
    });
  });

  it('오늘 했으면 지금 시작해 첫 몫을 받으라고 권한다', () => {
    expect(missedCopyOf({ ...missed, talkedToday: true }).box).toEqual({
      lead: '지금 시작하면 첫 ',
      strong: '500원',
      tail: '이 쌓여요',
    });
  });
});
