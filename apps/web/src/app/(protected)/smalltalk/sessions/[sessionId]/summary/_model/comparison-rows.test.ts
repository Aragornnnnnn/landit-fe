// 지난번과 비교 카드의 줄 — 막대 길이는 둘 중 큰 값 기준, 첫 스몰톡이면 지난번은 0
import { createTranslator } from 'next-intl';
import { describe, expect, it } from 'vitest';

import type { SmallTalkSummaryComparison } from '@/features/small-talk/api/small-talk';
import ja from '@/shared/i18n/locales/ja';
import ko from '@/shared/i18n/locales/ko';

import { toComparisonRows, toPeriodLabel } from './comparison-rows';

const tKo = createTranslator({
  locale: 'ko',
  messages: ko,
  namespace: 'smallTalk.comparison',
});
const tJa = createTranslator({
  locale: 'ja',
  messages: ja,
  namespace: 'smallTalk.comparison',
});

const comparison: SmallTalkSummaryComparison = {
  previousSessionId: 6,
  previousDate: '2026-09-10',
  current: { speakingMs: 245_000, turnCount: 18, maxWordsInTurn: 23 },
  previous: { speakingMs: 161_000, turnCount: 14, maxWordsInTurn: 12 },
};

describe('toComparisonRows', () => {
  it('세 지표를 라벨과 함께 나란히 놓고, 막대는 둘 중 큰 값을 가득으로 친다', () => {
    const rows = toComparisonRows(comparison, tKo, 'ko');

    expect(rows.map((row) => row.label)).toEqual([
      '말한 시간',
      '주고받은 말',
      '가장 길게 말한 턴',
    ]);
    expect(rows[0]).toMatchObject({
      previous: { value: '2분 41초' },
      current: { value: '4분 5초', ratio: 1 },
    });
    expect(rows[0]!.previous.ratio).toBeCloseTo(161 / 245);
    expect(rows[1]).toMatchObject({
      previous: { value: '14번' },
      current: { value: '18번' },
    });
    expect(rows[2]).toMatchObject({
      previous: { value: '12단어' },
      current: { value: '23단어' },
    });
  });

  it('일본어 화면은 라벨과 단위를 일본어로 적는다', () => {
    const rows = toComparisonRows(comparison, tJa, 'ja');

    expect(rows.map((row) => row.label)).toEqual([
      '話した時間',
      'やりとり',
      '一番長く話したターン',
    ]);
    expect(rows[0]!.current.value).toBe('4分5秒');
    expect(rows[1]!.current.value).toBe('18回');
    expect(rows[2]!.current.value).toBe('23語');
  });

  it('오늘이 지난번보다 줄었으면 지난번 막대가 가득이다', () => {
    const rows = toComparisonRows(
      {
        ...comparison,
        current: { ...comparison.current, turnCount: 7 },
      },
      tKo,
      'ko',
    );

    expect(rows[1]!.previous.ratio).toBe(1);
    expect(rows[1]!.current.ratio).toBeCloseTo(7 / 14);
  });

  it('둘 다 0이면 막대도 0이다 — 0으로 나누지 않는다', () => {
    const rows = toComparisonRows(
      {
        ...comparison,
        current: { speakingMs: 0, turnCount: 0, maxWordsInTurn: 0 },
        previous: { speakingMs: 0, turnCount: 0, maxWordsInTurn: 0 },
      },
      tKo,
      'ko',
    );

    expect(rows[0]!.current.ratio).toBe(0);
    expect(rows[0]!.previous.ratio).toBe(0);
  });
});

describe('toPeriodLabel', () => {
  it('지난번이 있으면 그 날짜에서 오늘로', () => {
    expect(toPeriodLabel(comparison, tKo, 'ko')).toBe('9월 10일 → 오늘');
  });

  it('일본어 화면은 날짜도 일본어 표기로 적는다', () => {
    expect(toPeriodLabel(comparison, tJa, 'ja')).toBe('9月10日 → 今日');
  });

  it('첫 스몰톡이면 첫 기록이라고 말한다', () => {
    expect(
      toPeriodLabel(
        {
          ...comparison,
          previousSessionId: null,
          previousDate: null,
        },
        tKo,
        'ko',
      ),
    ).toBe('첫 기록 · 오늘');
  });
});
