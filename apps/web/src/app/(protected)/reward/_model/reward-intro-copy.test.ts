// 환급 소개 화면 문구의 갈림길 — 오늘 대화 전과 후, 놓친 환급액이 있는지
import { describe, expect, it } from 'vitest';

import { rewardOfferOf } from '@/features/reward/model/refund-offer';

import { missedCopyOf, rewardIntroCopyOf } from './reward-intro-copy';

const offer = rewardOfferOf(50_000);

describe('rewardIntroCopyOf', () => {
  it('챌린지가 아니라 프리미엄 혜택으로 말한다 — 프리미엄이 사실상 0원이고, 결제한 금액이 입금된다', () => {
    expect(rewardIntroCopyOf(offer, false)).toEqual({
      title: { lead: '프리미엄이 사실상 ', strong: '0원!', tail: '' },
      subtitle: '환급 혜택으로 결제한 금액을 다 돌려받으세요',
      deposit: '50,000원 입금',
      caption: null,
      cta: '프리미엄 시작하고 환급받기',
    });
  });

  it('오늘의 시나리오를 이미 했으면 지금 시작하면 오늘 몫이 바로 쌓인다고 덧붙인다', () => {
    expect(rewardIntroCopyOf(offer, true).caption).toEqual({
      lead: '지금 시작하면 오늘 몫 ',
      strong: '500원',
      tail: '이 바로 쌓여요',
    });
  });

  it('가격이 다른 이용권이면 입금 금액이 따라 바뀐다', () => {
    expect(rewardIntroCopyOf(rewardOfferOf(30_000), false).deposit).toBe(
      '30,000원 입금',
    );
  });

  it('어느 문구에도 「챌린지」가 없다', () => {
    for (const talked of [false, true]) {
      expect(JSON.stringify(rewardIntroCopyOf(offer, talked))).not.toContain(
        '챌린지',
      );
    }
  });
});

describe('missedCopyOf', () => {
  const missed = {
    pastDays: 32,
    missedWon: 16_000,
    dailyWon: 500,
    today: '2026-10-15',
  };

  it('받을 수 있었던 금액을 흐리게 말하고, 오늘 아직이면 프리미엄으로 오늘부터 쌓자고 권한다', () => {
    expect(missedCopyOf({ ...missed, talkedToday: false })).toEqual({
      eyebrow: '지난 32일 동안 받을 수 있었던 금액',
      amount: '16,000원',
      box: {
        lead: '프리미엄을 시작하면\n오늘부터 ',
        strong: '500원',
        tail: '씩 쌓여요',
      },
      note: '꾸준히 하면 결제한 금액을 다 돌려받아요',
    });
  });

  it('오늘 했으면 지금 시작하면 오늘 몫이 바로 쌓인다고 권한다', () => {
    expect(missedCopyOf({ ...missed, talkedToday: true }).box).toEqual({
      lead: '지금 프리미엄을 시작하면\n오늘 몫 ',
      strong: '500원',
      tail: '이 바로 쌓여요',
    });
  });

  it('결제 전에 받아 둔 돈이 있으면 그것까지 더해 돌려받는다고 말한다', () => {
    const copy = missedCopyOf(
      { ...missed, talkedToday: false },
      { storedWon: 3_000, maximumWon: 50_000 },
    );

    expect(copy.note).toBe('받아 둔 3,000원까지 53,000원을 다 돌려받아요');
  });

  it('받아 둔 돈이 없으면 지금 문구 그대로다', () => {
    expect(
      missedCopyOf(
        { ...missed, talkedToday: false },
        { storedWon: 0, maximumWon: 50_000 },
      ).note,
    ).toBe('꾸준히 하면 결제한 금액을 다 돌려받아요');
  });

  it('결제 전에 받아 둔 돈이 있으면 그것까지 더해 돌려받는다고 말한다', () => {
    const copy = missedCopyOf(
      { ...missed, talkedToday: false },
      { storedWon: 3_000, maximumWon: 50_000 },
    );

    expect(copy.note).toBe('받아 둔 3,000원까지 53,000원을 다 돌려받아요');
  });

  it('받아 둔 돈이 없으면 지금 문구 그대로다', () => {
    expect(
      missedCopyOf(
        { ...missed, talkedToday: false },
        { storedWon: 0, maximumWon: 50_000 },
      ).note,
    ).toBe('꾸준히 하면 결제한 금액을 다 돌려받아요');
  });

  it('어느 문구에도 「챌린지」가 없다', () => {
    for (const talkedToday of [false, true]) {
      expect(
        JSON.stringify(missedCopyOf({ ...missed, talkedToday })),
      ).not.toContain('챌린지');
    }
  });
});
