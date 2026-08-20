// 지난 스몰톡 상세 — 조회 중엔 글자 대신 실제 화면 골격(스켈레톤)이 서야 완료 직후 돌아와도 실패처럼 보이지 않는다
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { useSmallTalkSessionQuery } from '@/features/small-talk/model/useSmallTalkSessionQuery';

import { SmallTalkHistoryDetail } from './SmallTalkHistoryDetail';

vi.mock('next/navigation', () => ({
  useRouter: () => ({ replace: vi.fn(), push: vi.fn() }),
}));
vi.mock('@/features/small-talk/model/useSmallTalkSessionQuery', () => ({
  useSmallTalkSessionQuery: vi.fn(),
}));

const sessionQuery = vi.mocked(useSmallTalkSessionQuery);

afterEach(cleanup);

describe('SmallTalkHistoryDetail', () => {
  it('조회 중이면 텍스트 대신 스켈레톤이 뜬다', () => {
    // given — 아직 세션 응답이 없다 (캐시가 비었거나 첫 진입)
    sessionQuery.mockReturnValue({
      session: null,
      error: null,
      isLoading: true,
      generationStuck: false,
      retry: vi.fn(),
      regenerate: vi.fn(),
    });

    // when
    render(<SmallTalkHistoryDetail sessionId={362} />);

    // then — 스크린리더엔 로딩 중임이 남고, 눈에는 글자가 아니라 골격이 보인다
    expect(
      screen.getByRole('status', { name: '표현을 불러오는 중' }),
    ).toBeInTheDocument();
    expect(screen.queryByText('표현을 불러오는 중이에요')).toBeNull();
  });
});
