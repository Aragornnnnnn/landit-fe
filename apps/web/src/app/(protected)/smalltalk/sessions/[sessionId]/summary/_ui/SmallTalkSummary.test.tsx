// 오늘의 스몰톡 — 말풍선·비교 카드는 늘 있고 첫 스몰톡이면 건너뛸 길이 없다. 조건 블록 셋은 상태에 따라 카드·스켈레톤·없음으로 갈린다
import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';

import type { SmallTalkSummaryResponse } from '@/features/small-talk/api/small-talk';
import { useSmallTalkSummaryQuery } from '@/features/small-talk/model/useSmallTalkSummaryQuery';

import { SmallTalkSummary } from './SmallTalkSummary';

const replace = vi.hoisted(() => vi.fn());
vi.mock('next/navigation', () => ({
  useRouter: () => ({ replace, push: vi.fn() }),
}));
vi.mock('@/features/small-talk/model/useSmallTalkSummaryQuery', () => ({
  useSmallTalkSummaryQuery: vi.fn(),
}));

const summaryQuery = vi.mocked(useSmallTalkSummaryQuery);

const summaryOf = (): SmallTalkSummaryResponse => ({
  sessionId: 7,
  title: '카페 얘기',
  pending: false,
  firstSession: false,
  headline: {
    text: '지난번보다 1분 24초 더 말했어요!',
    subline: '할 말이 그만큼 늘었다는 거예요.',
    pose: 'POINT',
  },
  comparison: {
    previousSessionId: 6,
    previousDate: '2026-09-10',
    current: { speakingMs: 245_000, turnCount: 18, maxWordsInTurn: 23 },
    previous: { speakingMs: 161_000, turnCount: 14, maxWordsInTurn: 12 },
  },
  growth: null,
  reusedExpressions: { pending: false, items: [] },
  followUp: {
    pending: false,
    triggerType: 'CONCERN',
    question: '다음엔 요즘 빠져 있는 거 얘기해줘.',
    invite: '기억해둘게.',
  },
  correctionCount: 3,
});

const renderSummary = (
  summary: SmallTalkSummaryResponse | null,
  { error = null as Error | null, isLoading = false, waitExpired = false } = {},
) => {
  summaryQuery.mockReturnValue({
    summary,
    error,
    isLoading,
    waitExpired,
    retry: vi.fn(),
  });
  render(<SmallTalkSummary sessionId={7} />);
};

afterEach(cleanup);

describe('SmallTalkSummary', () => {
  it('래디 말풍선에 서버가 준 두 줄이 그대로 보인다', () => {
    renderSummary(summaryOf());

    expect(
      screen.getByText('지난번보다 1분 24초 더 말했어요!'),
    ).toBeInTheDocument();
    expect(
      screen.getByText('할 말이 그만큼 늘었다는 거예요.'),
    ).toBeInTheDocument();
  });

  it('지난번이 있으면 비교 카드에 그 날짜와 양쪽 값이 보이고, 건너뛸 길도 있다', () => {
    renderSummary(summaryOf());

    expect(screen.getByText('9월 10일 → 오늘')).toBeInTheDocument();
    expect(screen.getByText('2분 41초')).toBeInTheDocument();
    expect(screen.getByText('4분 5초')).toBeInTheDocument();
  });

  it('나가는 길은 상세 피드백 하나뿐이다 — 건너뛰는 링크를 두지 않는다', () => {
    renderSummary(summaryOf());

    expect(
      screen.queryByRole('button', { name: /볼게요/ }),
    ).not.toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: '상세 피드백 보러갈게요' }),
    ).toBeInTheDocument();
  });

  it('첫 스몰톡이면 지난번 자리는 첫 기록이고, 건너뛸 길이 없다', () => {
    renderSummary({
      ...summaryOf(),
      firstSession: true,
      comparison: {
        previousSessionId: null,
        previousDate: null,
        current: { speakingMs: 245_000, turnCount: 18, maxWordsInTurn: 23 },
        previous: { speakingMs: 0, turnCount: 0, maxWordsInTurn: 0 },
      },
    });

    expect(screen.getByText('첫 기록 · 오늘')).toBeInTheDocument();
  });

  it('상세 피드백 보러가기를 누르면 종료 흐름 표식을 달고 대화 보기로 간다', async () => {
    renderSummary(summaryOf());

    await userEvent.click(
      screen.getByRole('button', { name: '상세 피드백 보러갈게요' }),
    );

    expect(replace).toHaveBeenCalledWith(
      '/smalltalk/sessions/7/messages?next=learning',
    );
  });

  it('닫기를 누르면 상세 피드백을 건너뛰고 축하를 켠 표현 화면으로 간다', async () => {
    renderSummary(summaryOf());

    await userEvent.click(screen.getByRole('button', { name: '닫기' }));

    expect(replace).toHaveBeenCalledWith(
      '/expressions/session/7/branch?celebrate=1',
    );
  });

  it('조회 중이면 글자 대신 스켈레톤이 선다', () => {
    renderSummary(null, { isLoading: true });

    expect(
      screen.getByRole('status', { name: '오늘의 스몰톡을 불러오는 중' }),
    ).toBeInTheDocument();
  });

  it('총평을 아직 계산 중이면 말풍선 자리에 스켈레톤이 선다', () => {
    // Given 표현 재사용·후속 질문은 왔지만 총평은 아직인 응답 (교정이 끝나길 기다리는 중)
    renderSummary({
      ...summaryOf(),
      pending: true,
      firstSession: null,
      headline: null,
      comparison: null,
      growth: null,
      correctionCount: null,
    });

    expect(
      screen.getByRole('status', { name: '오늘의 스몰톡을 불러오는 중' }),
    ).toBeInTheDocument();
  });

  it('상한까지 기다려도 총평이 안 오면 붙잡지 않고 나갈 길을 준다', () => {
    renderSummary(
      {
        ...summaryOf(),
        pending: true,
        firstSession: null,
        headline: null,
        comparison: null,
        growth: null,
        correctionCount: null,
      },
      { waitExpired: true },
    );

    expect(
      screen.getByRole('button', { name: '표현 배우러 가기' }),
    ).toBeInTheDocument();
  });

  it('조회에 실패하면 다시 시도할 수 있고, 표현 학습으로 바로 갈 수도 있다', async () => {
    renderSummary(null, { error: new Error('완료되지 않은 세션입니다.') });

    expect(screen.getByText('완료되지 않은 세션입니다.')).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: '다시 시도' }),
    ).toBeInTheDocument();
    await userEvent.click(
      screen.getByRole('button', { name: '표현 배우러 가기' }),
    );

    expect(replace).toHaveBeenCalledWith(
      '/expressions/session/7/branch?celebrate=1',
    );
  });
});

const growth = {
  pattern: 'PAST_TENSE',
  patternLabel: '과거형',
  succeeded: true,
  previousDate: '2026-09-10',
  previousSentence: 'I go to gym with my friend.',
  previousWrongSpan: 'go',
  currentSentence: 'I went to the gym with my friend.',
  currentSpan: 'went',
  previousCount: 2,
  currentCount: 0,
};

// 인용문 속 구절은 칩(원형)과 다른 모양으로 둔다 — 화면에서 둘이 따로 보이는지 구분해 세려고
const reusedItem = (expressionId: number, text: string) => ({
  expressionId,
  text,
  meaning: `${text}의 뜻`,
  sourceLabel: '9월 10일 「주말 계획」',
  messageId: 55000 + expressionId,
  quotedSentence: `I said ${text.toUpperCase()} today.`,
  matchedText: text.toUpperCase(),
});

describe('SmallTalkSummary 실수 기억 카드', () => {
  it('오늘 맞았으면 지난번엔 헷갈렸던 것으로 부르고, 두 문장을 그때·오늘로 보여준다', () => {
    renderSummary({ ...summaryOf(), growth });

    expect(screen.getByText('지난번엔 헷갈렸던 과거형')).toBeInTheDocument();
    expect(screen.getByText('9월 10일')).toBeInTheDocument();
    expect(screen.getByText('go')).toBeInTheDocument();
    expect(screen.getByText('went')).toBeInTheDocument();
    expect(
      screen.getByText('지난번엔 2번 헷갈렸는데, 오늘은 다 맞았어요.'),
    ).toBeInTheDocument();
  });

  it('오늘도 틀렸으면 아직 헷갈리는 것으로 부른다', () => {
    renderSummary({
      ...summaryOf(),
      growth: {
        ...growth,
        succeeded: false,
        currentSentence: 'Yesterday I go to the gym.',
        currentSpan: 'go',
        currentCount: 2,
      },
    });

    expect(screen.getByText('아직 헷갈리는 과거형')).toBeInTheDocument();
    expect(
      screen.getByText(/지난번에 이어 오늘도 2번 헷갈렸어요/),
    ).toBeInTheDocument();
  });

  it('실수 기억이 없으면 카드가 없다', () => {
    renderSummary(summaryOf());

    expect(screen.queryByText(/헷갈/)).not.toBeInTheDocument();
  });
});

describe('SmallTalkSummary 배운 표현 재사용', () => {
  it('쓴 표현이 없으면 카드가 없다', () => {
    renderSummary(summaryOf());

    expect(
      screen.queryByText('랜딧에서 배운 표현을 실제로 사용했어요'),
    ).not.toBeInTheDocument();
  });

  it('쓴 표현은 칩·출처·인용문·뜻으로 보인다', () => {
    renderSummary({
      ...summaryOf(),
      reusedExpressions: {
        pending: false,
        items: [reusedItem(1, 'grab a coffee')],
      },
    });

    expect(
      screen.getByText('랜딧에서 배운 표현을 실제로 사용했어요'),
    ).toBeInTheDocument();
    expect(screen.getByText('grab a coffee')).toBeInTheDocument();
    expect(screen.getByText('9월 10일 「주말 계획」')).toBeInTheDocument();
    expect(screen.getByText('GRAB A COFFEE')).toBeInTheDocument();
    expect(screen.getByText('grab a coffee의 뜻')).toBeInTheDocument();
  });

  it('딱 2개면 다 펼치고 더 보기가 없다', () => {
    renderSummary({
      ...summaryOf(),
      reusedExpressions: {
        pending: false,
        items: [reusedItem(1, 'grab a coffee'), reusedItem(2, 'be down for')],
      },
    });

    expect(screen.getByText('be down for')).toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: /더 보기/ }),
    ).not.toBeInTheDocument();
  });

  it('3개 이상이면 2개만 펼치고, 더 보기를 누르면 그 자리에서 나머지가 펼쳐진다', async () => {
    renderSummary({
      ...summaryOf(),
      reusedExpressions: {
        pending: false,
        items: [
          reusedItem(1, 'grab a coffee'),
          reusedItem(2, 'be down for'),
          reusedItem(3, 'stop by'),
        ],
      },
    });

    expect(screen.queryByText('stop by')).not.toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: '+1개 더 보기' }));

    expect(screen.getByText('stop by')).toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: /더 보기/ }),
    ).not.toBeInTheDocument();
  });

  it('아직 만드는 중이면 그 자리에 스켈레톤이 선다', () => {
    renderSummary({
      ...summaryOf(),
      reusedExpressions: { pending: true, items: [] },
    });

    expect(
      screen.getByRole('status', { name: '배운 표현 재사용을 찾는 중' }),
    ).toBeInTheDocument();
  });

  it('상한까지 기다려도 안 오면 스켈레톤도 카드도 없다', () => {
    renderSummary(
      { ...summaryOf(), reusedExpressions: { pending: true, items: [] } },
      { waitExpired: true },
    );

    expect(screen.queryByRole('status')).not.toBeInTheDocument();
  });
});

describe('SmallTalkSummary 다음 스몰톡에서', () => {
  it('질문과 초대가 보인다 — 기억이 없어 기본 문구여도 그린다', () => {
    renderSummary(summaryOf());

    expect(screen.getByText('다음 스몰톡에서')).toBeInTheDocument();
    expect(
      screen.getByText('다음엔 요즘 빠져 있는 거 얘기해줘.'),
    ).toBeInTheDocument();
    expect(screen.getByText('기억해둘게.')).toBeInTheDocument();
  });

  it('아직 만드는 중이면 그 자리에 스켈레톤이 선다', () => {
    renderSummary({
      ...summaryOf(),
      followUp: {
        pending: true,
        triggerType: 'NONE',
        question: '',
        invite: '',
      },
    });

    expect(
      screen.getByRole('status', { name: '다음 스몰톡 질문을 찾는 중' }),
    ).toBeInTheDocument();
  });
});
