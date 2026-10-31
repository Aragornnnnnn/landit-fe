// 지난 대화 목록 — 교정이 있으면 교정 수, 없으면 잘한 턴 수를 보여 주고, 대화가 없으면 빈 안내가 선다
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import type { RoleplaySessionSummary } from '@/features/roleplay/api/roleplay';
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

const showSessions = (sessions: RoleplaySessionSummary[]) => {
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

const session = (
  overrides: Partial<RoleplaySessionSummary>,
): RoleplaySessionSummary => ({
  sessionId: 1,
  talkedAt: '2026-10-28T15:12:00',
  turnCount: 5,
  correctionCount: 0,
  goodCount: 4,
  ...overrides,
});

afterEach(cleanup);

describe('RoleplaySessions', () => {
  it('교정이 있었던 대화는 교정 수를 보여 준다', () => {
    showSessions([session({ turnCount: 7, correctionCount: 2 })]);

    render(<RoleplaySessions scenarioId={1} />);

    expect(screen.getByText('7번 주고받음 · 교정 2개')).toBeInTheDocument();
  });

  it('교정 없이 끝난 대화는 잘한 턴 수를 보여 준다', () => {
    showSessions([session({ turnCount: 4, correctionCount: 0, goodCount: 3 })]);

    render(<RoleplaySessions scenarioId={1} />);

    expect(screen.getByText('4번 주고받음 · 잘했어요 3개')).toBeInTheDocument();
  });

  it('이 시나리오로 한 대화가 없으면 빈 안내를 보여 준다', () => {
    showSessions([]);

    render(<RoleplaySessions scenarioId={1} />);

    expect(
      screen.getByText('아직 이 시나리오로 한 대화가 없어요'),
    ).toBeInTheDocument();
  });
});
