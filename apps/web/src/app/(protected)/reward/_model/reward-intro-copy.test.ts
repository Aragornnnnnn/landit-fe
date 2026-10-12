// 환급 소개 화면 문구의 갈림길 — 오늘 대화 전과 후
import { describe, expect, it } from 'vitest';

import { rewardOfferOf } from '@/features/reward/model/refund-offer';

import { rewardIntroCopyOf } from './reward-intro-copy';

const offer = rewardOfferOf(50_000);

describe('rewardIntroCopyOf', () => {
  it('오늘의 시나리오를 아직 안 했으면 100일의 최대 금액을 크게, 하루 몫을 그 아래에 말한다', () => {
    expect(rewardIntroCopyOf(offer, false)).toEqual({
      eyebrow: '100일 동안 매일 대화하면',
      amount: '최대 50,000원',
      caption: '오늘의 시나리오를 할 때마다 500원씩 쌓여요',
      cta: '100일 환급 챌린지 시작하기',
    });
  });

  it('오늘의 시나리오를 이미 했으면 그 대화로 쌓인 금액과 오늘 시작해야 받는다는 것을 말한다', () => {
    expect(rewardIntroCopyOf(offer, true)).toEqual({
      eyebrow: '오늘 대화로 쌓인 환급액',
      amount: '500원',
      caption: '오늘 챌린지를 시작하면 받을 수 있어요',
      cta: '100일 환급 챌린지 시작하기',
    });
  });

  it('가격이 다른 이용권이면 금액이 따라 바뀐다', () => {
    expect(rewardIntroCopyOf(rewardOfferOf(30_000), false).amount).toBe(
      '최대 30,000원',
    );
  });
});
