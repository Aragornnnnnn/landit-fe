// 사유별 화면 문구·카드 — 플랜·체험·기록 유무로 갈리는 자리만 본다
import { describe, expect, it } from 'vitest';

import type { PaidSubscriptionSummary } from '@/features/subscription/model/subscription-summary';

import {
  dailyWon,
  methodRetentionContent,
  retentionContent,
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

const context = (summary: PaidSubscriptionSummary) => ({
  summary,
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

  it('적용되는 금액이 있으면 그 금액으로 하루 요금을 잰다', () => {
    const content = retentionContent(
      'price',
      context(active({ plan: 'yearly', price: 94_800 })),
    );

    expect(content.cards[0]).toMatchObject({
      sublabel: '연 94,800원',
      value: '하루 260원',
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
