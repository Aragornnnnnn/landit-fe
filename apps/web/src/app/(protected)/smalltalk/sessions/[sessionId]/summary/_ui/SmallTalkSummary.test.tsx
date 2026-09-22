// 오늘의 스몰톡 — 말풍선·비교 카드는 늘 있고, 첫 스몰톡이면 건너뛸 길이 없다
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
