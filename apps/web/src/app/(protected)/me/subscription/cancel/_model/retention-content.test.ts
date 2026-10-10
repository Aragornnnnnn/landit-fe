// 사유별 화면 문구·카드 — 플랜·체험·기록 유무로 갈리는 자리만 본다
import { describe, expect, it } from 'vitest';

import {
  endedRewardView,
  rewardView,
} from '@/features/reward/model/reward.fixture';
import type { PaidSubscriptionSummary } from '@/features/subscription/model/my-subscription/subscription-summary';

import {
  dailyWon,
  methodRetentionContent,
  refundNoticeContent,
  refundStakeOf,
  retentionContent,
  type RefundStake,
} from './retention-content';

const active = (
  overrides: Partial<PaidSubscriptionSummary> = {},
): PaidSubscriptionSummary => ({
  kind: 'active',
  expiresAt: '2026-10-04T12:00:00',
  renews: true,
  plan: 'monthly',
  price: 14_900,
  ...overrides,
});

const context = (
  summary: PaidSubscriptionSummary,
  stake: RefundStake | null = null,
) => ({
  summary,
  stake,
  nickname: '준서',
  totalActiveDays: 12,
  levelLabel: '견습 마법사 Lv.3',
  otherText: '',
});

describe('dailyWon', () => {
  it('하루 요금을 10원 단위로 반올림한다', () => {
    expect(dailyWon(14900, 30)).toBe(500);
    expect(dailyWon(58500, 365)).toBe(160);
  });
});

describe('retentionContent — 가격 부담', () => {
  it('월간이면 껌 한 통 값 문구와 하루 500원 행이 나온다', () => {
    const content = retentionContent('price', context(active()));

    expect(content.body[1]).toContain('껌 한 통 값');
    expect(content.cards).toEqual([
      {
        kind: 'row',
        label: '지금 · 월간',
        sublabel: undefined,
        value: '하루 500원',
      },
    ]);
  });

  it('연간이면 사탕 하나 값 문구와 연 요금 보조 문구가 붙는다', () => {
    const content = retentionContent(
      'price',
      context(active({ plan: 'yearly', price: 58_500 })),
    );

    expect(content.body[1]).toContain('사탕 하나 값');
    expect(content.cards[0]).toMatchObject({
      label: '지금 · 연간',
      sublabel: '연 58,500원',
      value: '하루 160원',
    });
  });

  it('6개월이면 180일로 나눈 하루 요금과 6개월 요금 보조 문구가 붙는다', () => {
    const content = retentionContent(
      'price',
      context(active({ plan: 'halfyear', price: 59_900 })),
    );

    expect(content.body[0]).toBe('6개월 요금은 하루 330원이에요.');
    expect(content.cards[0]).toMatchObject({
      label: '지금 · 6개월',
      sublabel: '6개월 59,900원',
      value: '하루 330원',
    });
  });

  it('3개월이면 90일로 나눈 하루 요금과 3개월 요금 보조 문구가 붙는다', () => {
    const content = retentionContent(
      'price',
      context(active({ plan: 'quarterly', price: 39_900 })),
    );

    expect(content.body[0]).toBe('3개월 요금은 하루 440원이에요.');
    expect(content.cards[0]).toMatchObject({
      label: '지금 · 3개월',
      sublabel: '3개월 39,900원',
      value: '하루 440원',
    });
  });

  it('적용되는 금액이 있으면 그 금액으로 하루 요금을 잰다', () => {
    const content = retentionContent(
      'price',
      // 서버 결제액은 등록값 폴백(YEARLY_PRICE)과 다른 값이어야 폴백을 쓰는 회귀가 잡힌다
      context(active({ plan: 'yearly', price: 99_000 })),
    );

    expect(content.cards[0]).toMatchObject({
      sublabel: '연 99,000원',
      value: '하루 270원',
    });
  });

  it('체험 중이면 첫 결제일 행이 하나 더 붙는다', () => {
    const content = retentionContent(
      'price',
      context(active({ kind: 'trial' })),
    );

    expect(content.cards[1]).toMatchObject({ label: '첫 결제일' });
  });

  it('플랜을 모르면 숫자 없는 문구만 두고 카드는 없다', () => {
    const content = retentionContent('price', context(active({ plan: null })));

    expect(content.body.join(' ')).not.toMatch(/원/);
    expect(content.cards).toEqual([]);
  });
});

describe('retentionContent — 실력 안 늚', () => {
  it('이름을 넣고 학습한 날·레벨 두 칸을 보여준다', () => {
    const content = retentionContent('progress', context(active()));

    expect(content.body[0]).toContain('준서님');
    expect(content.cards).toEqual([
      {
        kind: 'stat',
        items: [
          { value: '12일', label: '학습한 날' },
          { value: '견습 마법사 Lv.3', label: '내 학습 레벨' },
        ],
      },
    ]);
  });

  it('기록을 하나도 모르면 카드를 그리지 않는다', () => {
    const content = retentionContent('progress', {
      ...context(active()),
      totalActiveDays: null,
      levelLabel: null,
    });

    expect(content.cards).toEqual([]);
  });
});

describe('retentionContent — 편지함으로 가는 사유', () => {
  it('콘텐츠·오류·기타는 주 버튼이 편지함으로 간다', () => {
    for (const reason of ['content', 'bug', 'other'] as const) {
      expect(
        retentionContent(reason, { ...context(active()), otherText: '내용' })
          .primary.to,
      ).toBe('mailbox');
    }
  });

  it('기타는 적은 글을 그대로 인용한다', () => {
    const content = retentionContent('other', {
      ...context(active()),
      otherText: '  발음 평가가 엄격해요 ',
    });

    expect(content.cards).toEqual([
      { kind: 'quote', label: '적어주신 내용', text: '발음 평가가 엄격해요' },
    ]);
  });
});

describe('methodRetentionContent', () => {
  it('방법마다 제목이 다르고 카드는 없다', () => {
    const titles = (['academy', 'other_app', 'youtube', 'abroad'] as const).map(
      (method) => methodRetentionContent(method).title,
    );

    expect(new Set(titles).size).toBe(4);
    expect(methodRetentionContent('academy').cards).toEqual([]);
  });
});

describe('환급을 쌓는 중인 사람', () => {
  const stake = { balanceWon: 2015, maximumWon: 59_900 };

  it('쌓는 중일 때만 걸어 둔 금액이 있다', () => {
    expect(refundStakeOf(rewardView())).toEqual({
      balanceWon: rewardView().current!.balanceWon,
      maximumWon: rewardView().current!.maximumWon,
    });
    expect(refundStakeOf(endedRewardView(31_920))).toBeNull();
    expect(refundStakeOf(null)).toBeNull();
    // 도는 회차를 가진 채 검토로 넘어갈 수 있다
    expect(refundStakeOf(rewardView({ state: 'REVIEW' }))).toBeNull();
  });

  it('사유를 묻기 전에 쌓인 금액과, 해지하면 다음 회차 환급이 없다는 것을 알린다', () => {
    const content = refundNoticeContent(stake);

    expect(content.title).toBe('지금까지 2,015원을 쌓았어요');
    expect(content.body).toContain('해지하면 다음 회차부터는 환급이 없어요.');
    expect(content.cards).toEqual([
      { kind: 'row', label: '지금까지 쌓인 환급액', value: '2,015원' },
      { kind: 'row', label: '최대 환급액', value: '59,900원' },
    ]);
  });

  it('쌓인 게 없으면 0원을 제목으로 내세우지 않는다', () => {
    const content = refundNoticeContent({ balanceWon: 0, maximumWon: 59_900 });

    expect(content.title).toBe('오늘부터 다시 쌓을 수 있어요');
  });

  it('가격 부담에는 하루 요금 대신 돌려받는 금액으로 답한다', () => {
    const content = retentionContent(
      'price',
      context(active({ plan: 'halfyear', price: 59_900 }), stake),
    );

    expect(content.body[0]).toBe('최대 59,900원까지 돌려받는 플랜이에요.');
    expect(content.cards).toHaveLength(2);
  });
});
