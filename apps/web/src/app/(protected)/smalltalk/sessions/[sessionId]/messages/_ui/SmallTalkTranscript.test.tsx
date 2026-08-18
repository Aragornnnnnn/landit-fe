// 그날 주고받은 말 — 조회 중엔 글자 대신 말풍선 골격(스켈레톤)이 선다
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { useSmallTalkSessionQuery } from '@/features/small-talk/model/useSmallTalkSessionQuery';

import { SmallTalkTranscript } from './SmallTalkTranscript';

vi.mock('next/navigation', () => ({
  useRouter: () => ({ replace: vi.fn(), push: vi.fn() }),
}));
vi.mock('@/features/small-talk/model/useSmallTalkSessionQuery', () => ({
  useSmallTalkSessionQuery: vi.fn(),
}));

const sessionQuery = vi.mocked(useSmallTalkSessionQuery);

afterEach(cleanup);

describe('SmallTalkTranscript', () => {
  it('조회 중이면 텍스트 대신 스켈레톤이 뜬다', () => {
    // given
    sessionQuery.mockReturnValue({
      session: null,
      error: null,
      isLoading: true,
      generationStuck: false,
      retry: vi.fn(),
      regenerate: vi.fn(),
    });

    // when
    render(<SmallTalkTranscript sessionId={362} />);

    // then
    expect(
      screen.getByRole('status', { name: '대화를 불러오는 중' }),
    ).toBeInTheDocument();
    expect(screen.queryByText('대화를 불러오는 중이에요')).toBeNull();
  });
});
