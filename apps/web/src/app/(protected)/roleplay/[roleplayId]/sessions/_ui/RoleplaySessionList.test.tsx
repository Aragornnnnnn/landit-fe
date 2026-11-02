// 지난 대화 목록 — 시나리오 기록과 같은 틀로 회차와 날짜를 보여 주고, 행은 그 대화의 기록으로 보낸다
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import type { RoleplayHistorySummary } from '@/features/roleplay/api/roleplay';
import { useRoleplayHistoryQuery } from '@/features/roleplay/model/useRoleplayHistoryQuery';
import { useRoleplayScenariosQuery } from '@/features/roleplay/model/useRoleplayScenariosQuery';

import { RoleplaySessionList } from './RoleplaySessionList';

// 테스트 환경에선 next/link가 React를 두 벌 읽는다 — 그냥 a로 그린다
vi.mock('next/link', () => ({
  default: ({ href, children, ...rest }: React.ComponentProps<'a'>) => (
    <a href={href} {...rest}>
      {children}
    </a>
  ),
}));
vi.mock('next/navigation', () => ({
  useRouter: () => ({ back: vi.fn(), replace: vi.fn() }),
}));
vi.mock('@/features/roleplay/model/useRoleplayScenariosQuery', () => ({
  useRoleplayScenariosQuery: vi.fn(),
}));
vi.mock('@/features/roleplay/model/useRoleplayHistoryQuery', () => ({
  useRoleplayHistoryQuery: vi.fn(),
}));

const showSessions = (sessions: RoleplayHistorySummary[]) => {
  vi.mocked(useRoleplayScenariosQuery).mockReturnValue({
    scenarios: [],
    error: null,
    retry: vi.fn(),
  });
  vi.mocked(useRoleplayHistoryQuery).mockReturnValue({
    sessions,
    error: null,
    retry: vi.fn(),
  });
};

const session = (sessionId: number): RoleplayHistorySummary => ({
  sessionId,
  title: '카페 주문',
  characterId: 'chloe',
  startedAt: '2026-10-28T15:00:00',
  completedAt: '2026-10-28T15:12:00',
  userSpeakingDurationMs: 47_000,
});

afterEach(cleanup);

describe('RoleplaySessionList', () => {
  it('최신 대화가 가장 큰 회차로 위에 선다 — 서버가 최신순으로 준다', () => {
    showSessions([session(3), session(2), session(1)]);

    render(<RoleplaySessionList roleplayId={5} />);

    expect(screen.getAllByRole('link').map((row) => row.textContent)).toEqual([
      expect.stringContaining('3번째 대화'),
      expect.stringContaining('2번째 대화'),
      expect.stringContaining('1번째 대화'),
    ]);
  });

  it('아랫줄에 그 대화를 끝낸 날짜를 보여 준다', () => {
    showSessions([session(1)]);

    render(<RoleplaySessionList roleplayId={5} />);

    expect(screen.getByText('10월 28일')).toBeInTheDocument();
  });

  it('행을 누르면 목록으로 돌아올 수 있게 그 대화의 기록으로 간다', () => {
    showSessions([session(9)]);

    render(<RoleplaySessionList roleplayId={5} />);

    expect(screen.getByRole('link')).toHaveAttribute(
      'href',
      '/roleplay/sessions/9/messages?from=5',
    );
  });

  it('이 시나리오로 한 대화가 없으면 빈 안내를 보여 준다', () => {
    showSessions([]);

    render(<RoleplaySessionList roleplayId={5} />);

    expect(
      screen.getByText('아직 이 시나리오로 한 대화가 없어요'),
    ).toBeInTheDocument();
  });
});
