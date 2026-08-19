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
