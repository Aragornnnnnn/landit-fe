// 지난 스몰톡 목록 — 조회 중엔 글자 대신 목록 행 골격(스켈레톤)이 선다
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { useSmallTalkSessionsQuery } from '@/features/small-talk/model/useSmallTalkSessionsQuery';

import { SmallTalkHistory } from './SmallTalkHistory';

vi.mock('next/navigation', () => ({
  useRouter: () => ({ replace: vi.fn(), push: vi.fn() }),
}));
vi.mock('@/features/small-talk/model/useSmallTalkSessionsQuery', () => ({
  useSmallTalkSessionsQuery: vi.fn(),
}));

const sessionsQuery = vi.mocked(useSmallTalkSessionsQuery);

afterEach(cleanup);

describe('SmallTalkHistory', () => {
  it('조회 중이면 텍스트 대신 스켈레톤이 뜬다', () => {
    // given — 첫 장이 아직 안 왔다
    sessionsQuery.mockReturnValue({
      sessions: null,
      error: null,
      isLoading: true,
      retry: vi.fn(),
      hasMore: false,
      loadingMore: false,
      loadMore: vi.fn(),
    });

    // when
    render(<SmallTalkHistory />);

    // then
    expect(
      screen.getByRole('status', { name: '지난 대화를 불러오는 중' }),
    ).toBeInTheDocument();
    expect(screen.queryByText('지난 대화를 불러오는 중이에요')).toBeNull();
  });
});

describe('SmallTalkHistory 행의 말한 시간', () => {
  const renderWithSpeaking = (userSpeakingDurationMs: number) => {
    sessionsQuery.mockReturnValue({
      sessions: [
        {
          sessionId: 7,
          title: '카페 얘기',
          startedAt: '2026-09-10T09:50:00',
          completedAt: '2026-09-10T10:00:00',
          userSpeakingDurationMs,
          expressionGenerationStatus: 'READY',
          expressionLearningStatus: 'NOT_STARTED',
          expressionCount: 3,
          completedExpressionCount: 0,
        },
      ],
      error: null,
      isLoading: false,
      retry: vi.fn(),
      hasMore: false,
      loadingMore: false,
      loadMore: vi.fn(),
    });
    render(<SmallTalkHistory />);
  };

  it('말한 시간이 있으면 날짜 옆에 붙는다', () => {
    renderWithSpeaking(161_000);

    expect(screen.getByText(/· 2분 41초$/)).toBeInTheDocument();
  });

  it('전부 타이핑해 0초면 날짜만 남는다', () => {
    renderWithSpeaking(0);

    expect(screen.queryByText(/0초/)).toBeNull();
    expect(screen.queryByText(/ · /)).toBeNull();
  });
});
