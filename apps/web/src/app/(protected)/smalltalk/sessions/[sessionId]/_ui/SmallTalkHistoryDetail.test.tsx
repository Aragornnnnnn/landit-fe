// 지난 스몰톡 상세 — 조회 중엔 글자 대신 실제 화면 골격(스켈레톤)이 서야 완료 직후 돌아와도 실패처럼 보이지 않는다
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import type {
  SmallTalkHistoryMessage,
  SmallTalkSessionDetailResponse,
} from '@/features/small-talk/api/small-talk';
import { useSmallTalkSessionQuery } from '@/features/small-talk/model/useSmallTalkSessionQuery';

import { SmallTalkHistoryDetail } from './SmallTalkHistoryDetail';

// 페이월 게이트는 구독·스트릭 조회를 끌고 온다 — 이 화면 테스트에선 항상 열린 문으로 치환한다
vi.mock('@/features/subscription/model/usePaywallGate', () => ({
  usePaywallGate: () => ({
    decision: 'open',
    guard: (go: () => void) => go(),
  }),
}));
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
      waitExpired: false,
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

describe('SmallTalkHistoryDetail 더 자연스러운 말 뱃지', () => {
  const message: SmallTalkHistoryMessage = {
    messageId: 1,
    turnNumber: 1,
    messageSequence: 1,
    role: 'USER',
    content: 'Hi.',
    translatedContent: null,
    emotion: null,
    innerThought: null,
    innerThoughtType: null,
  };

  const renderWithCorrections = (correctionCount: number) => {
    const session: SmallTalkSessionDetailResponse = {
      sessionId: 362,
      title: 'Cardio workout',
      startedAt: '2026-09-10T09:50:00',
      completedAt: '2026-09-10T10:00:00',
      userSpeakingDurationMs: 52_000,
      messages: [message],
      expressionGenerationStatus: 'READY',
      expressionLearningStatus: 'NOT_STARTED',
      expressions: [],
      correctionCount,
    };
    sessionQuery.mockReturnValue({
      session,
      error: null,
      isLoading: false,
      generationStuck: false,
      waitExpired: false,
      retry: vi.fn(),
      regenerate: vi.fn(),
    });
    render(<SmallTalkHistoryDetail sessionId={362} />);
  };

  it('교정이 있으면 대화 다시 보기 아이콘에 그 개수가 뱃지로 보인다', () => {
    renderWithCorrections(2);

    expect(
      screen.getByRole('button', {
        name: '대화 다시 보기, 더 자연스러운 말 2개',
      }),
    ).toBeInTheDocument();
    expect(screen.getByText('2')).toBeInTheDocument();
  });

  it('교정이 없으면 뱃지가 없다', () => {
    renderWithCorrections(0);

    expect(
      screen.getByRole('button', { name: '대화 다시 보기' }),
    ).toBeInTheDocument();
    expect(screen.queryByText('0')).not.toBeInTheDocument();
  });
});
