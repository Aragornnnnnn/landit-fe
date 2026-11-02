// 지난 대화 목록 — 총횟수와 날짜를 보여 주고, 행은 그 대화의 기록으로 보낸다. 대화가 없으면 빈 안내가 선다
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import type { RoleplayHistorySummary } from '@/features/roleplay/api/roleplay';
import { useRoleplayScenariosQuery } from '@/features/roleplay/model/useRoleplayScenariosQuery';
import { useRoleplaySessionsQuery } from '@/features/roleplay/model/useRoleplaySessionsQuery';

import { RoleplaySessions } from './RoleplaySessions';

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
vi.mock('@/features/roleplay/model/useRoleplaySessionsQuery', () => ({
  useRoleplaySessionsQuery: vi.fn(),
}));

const showSessions = (sessions: RoleplayHistorySummary[]) => {
  vi.mocked(useRoleplayScenariosQuery).mockReturnValue({
    scenarios: [],
    error: null,
    retry: vi.fn(),
  });
  vi.mocked(useRoleplaySessionsQuery).mockReturnValue({
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

describe('RoleplaySessions', () => {
  it('지난 대화 횟수를 제목으로 보여 준다', () => {
    showSessions([session(1), session(2), session(3)]);

    render(<RoleplaySessions roleplayId={5} />);

    expect(screen.getByText('지난 대화 3번')).toBeInTheDocument();
  });

  it('행을 누르면 목록으로 돌아올 수 있게 그 대화의 기록으로 간다', () => {
    showSessions([session(9)]);

    render(<RoleplaySessions roleplayId={5} />);

    expect(screen.getByRole('link')).toHaveAttribute(
      'href',
      '/roleplay/sessions/9/messages?from=5',
    );
  });

  it('이 시나리오로 한 대화가 없으면 빈 안내를 보여 준다', () => {
    showSessions([]);

    render(<RoleplaySessions roleplayId={5} />);

    expect(
      screen.getByText('아직 이 시나리오로 한 대화가 없어요'),
    ).toBeInTheDocument();
  });
});
