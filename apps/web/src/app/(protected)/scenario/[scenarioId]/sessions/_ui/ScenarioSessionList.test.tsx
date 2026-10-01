// 시나리오 기록 목록 — 회차를 최신순으로 세우고, 누르면 그 회차로, 뒤로는 보던 날의 카드로
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import type { ScenarioHistorySession } from '../_api/scenario-history';
import { ScenarioSessionList } from './ScenarioSessionList';

const mocks = vi.hoisted(() => ({
  push: vi.fn(),
  replace: vi.fn(),
  retry: vi.fn(),
  sessions: null as ScenarioHistorySession[] | null,
  error: null as Error | null,
}));
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: mocks.push, replace: mocks.replace }),
}));
vi.mock('@/shared/analytics', () => ({ track: vi.fn() }));
// next/link는 next 밑의 react 복사본을 잡아 훅 dispatcher가 null이 된다 — 주소만 보면 되니 평범한 앵커로 대체한다
vi.mock('next/link', () => ({
  default: ({ href, children, ...rest }: React.ComponentProps<'a'>) => (
    <a href={href} {...rest}>
      {children}
    </a>
  ),
}));
vi.mock('@/shared/ui/StarRating', () => ({
  StarRating: ({ rating }: { rating: number }) => <span>별 {rating}</span>,
}));
// 제목 고르기는 자기 테스트가 있다 — 여기선 그대로 쓰는지만 본다
vi.mock('@/features/scenario/model/useScenarioTitle', () => ({
  useScenarioTitle: () => '카페에서 주문하기',
}));
vi.mock('../_model/useScenarioHistoryQuery', () => ({
  useScenarioHistoryQuery: () => ({
    sessions: mocks.sessions,
    error: mocks.error,
    retry: mocks.retry,
  }),
}));

const session = (
  sessionId: number,
  endedAt: string,
  hasFeedback = true,
): ScenarioHistorySession => ({
  sessionId,
  startedAt: endedAt,
  endedAt,
  messages: [],
  feedback: hasFeedback
    ? ({ starRating: 2, nativeScore: 53 } as ScenarioHistorySession['feedback'])
    : null,
});

afterEach(() => {
  cleanup();
  mocks.sessions = null;
  mocks.error = null;
  vi.clearAllMocks();
});

describe('ScenarioSessionList', () => {
  it('회차를 최신순으로 몇 번째 대화인지와 함께 세우고, 보던 날을 달고 그 회차로 잇는다', () => {
    mocks.sessions = [
      session(30, '2026-09-30T21:00:00'),
      session(10, '2026-09-20T10:00:00'),
    ];
    render(<ScenarioSessionList scenarioId={12} date="2026-09-30" />);

    const rows = screen.getAllByRole('link', { name: /번째 대화/ });
    expect(rows.map((row) => row.textContent)).toEqual([
      expect.stringContaining('2번째 대화'),
      expect.stringContaining('1번째 대화'),
    ]);
    expect(rows[0]).toHaveAttribute(
      'href',
      '/scenario/12/sessions/30?date=2026-09-30',
    );
  });

  it('피드백이 저장되지 않은 회차는 점수 대신 그 사실을 보인다', () => {
    mocks.sessions = [session(30, '2026-09-30T21:00:00', false)];
    render(<ScenarioSessionList scenarioId={12} />);

    expect(screen.getByText('피드백 없음')).toBeInTheDocument();
  });

  it('완료한 회차가 없으면 빈 상태를 보인다', () => {
    mocks.sessions = [];
    render(<ScenarioSessionList scenarioId={12} />);

    expect(screen.getByText(/아직 마친 대화가 없어요/)).toBeInTheDocument();
  });

  it('뒤로 가면 보던 날의 시나리오 카드로 돌아간다', () => {
    mocks.sessions = [];
    render(<ScenarioSessionList scenarioId={12} date="2026-09-30" />);

    fireEvent.click(screen.getByRole('button', { name: '뒤로' }));

    expect(mocks.replace).toHaveBeenCalledWith('/scenario?date=2026-09-30');
  });

  it('받아 둔 기록이 있으면 다시 받다 실패해도 목록을 그대로 둔다', () => {
    mocks.sessions = [session(30, '2026-09-30T21:00:00')];
    mocks.error = new Error('네트워크 오류');
    render(<ScenarioSessionList scenarioId={12} />);

    expect(
      screen.getByRole('link', { name: /1번째 대화/ }),
    ).toBeInTheDocument();
  });

  it('불러오지 못하면 다시 시도할 수 있다', () => {
    mocks.error = new Error('기록을 불러오지 못했어요.');
    render(<ScenarioSessionList scenarioId={12} />);

    fireEvent.click(screen.getByRole('button', { name: '다시 시도' }));

    expect(mocks.retry).toHaveBeenCalledTimes(1);
  });
});
