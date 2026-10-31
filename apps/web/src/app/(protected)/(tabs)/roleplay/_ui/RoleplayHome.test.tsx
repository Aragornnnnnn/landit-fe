// 롤플레이 탭 — 빈 상태와 목록의 갈림, 카드와 만들기 버튼이 보내는 곳
import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';

import type { RoleplaySettings } from '@/features/roleplay/api/roleplay';
import { useRoleplayScenariosQuery } from '@/features/roleplay/model/useRoleplayScenariosQuery';

import { RoleplayHome } from './RoleplayHome';

// 테스트 환경에선 next/image가 React를 두 벌 읽는다 — 그림은 동작과 무관해 빈 자리로 둔다
vi.mock('next/image', () => ({ default: () => <span /> }));

const push = vi.fn();
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push, replace: vi.fn() }),
}));
// 구독은 열려 있다고 본다 — 게이트는 이동을 그대로 실행한다
vi.mock('@/features/subscription/model/paywall-gate/usePaywallGate', () => ({
  usePaywallGate: () => ({
    locked: false,
    deciding: false,
    guard: (go: () => void) => go(),
  }),
}));
vi.mock('@/features/roleplay/model/useRoleplayScenariosQuery', () => ({
  useRoleplayScenariosQuery: vi.fn(),
}));

const scenario = (overrides: Partial<RoleplaySettings>): RoleplaySettings => ({
  id: 1,
  characterId: 'chloe',
  title: '단골 카페에서 새 메뉴 주문하기',
  userRole: '손님',
  aiRole: '바리스타',
  situation: '주문하기',
  createdAt: '2026-10-31T10:00:00',
  ...overrides,
});

const showScenarios = (scenarios: RoleplaySettings[]) =>
  vi.mocked(useRoleplayScenariosQuery).mockReturnValue({
    scenarios,
    error: null,
    retry: vi.fn(),
  });

afterEach(() => {
  cleanup();
  push.mockClear();
});

describe('RoleplayHome', () => {
  it('만든 시나리오가 없으면 무엇을 하는 곳인지 안내한다', () => {
    showScenarios([]);

    render(<RoleplayHome />);

    expect(screen.getByText(/머릿속에만 있던 상황을/)).toBeInTheDocument();
    expect(screen.queryByText('내 시나리오')).not.toBeInTheDocument();
  });

  it('만든 시나리오가 있으면 카드로 쌓고 개수를 보여 준다', () => {
    showScenarios([
      scenario({ id: 1, title: '카페 주문' }),
      scenario({ id: 2, title: '공항 항의' }),
    ]);

    render(<RoleplayHome />);

    expect(screen.getByText('카페 주문')).toBeInTheDocument();
    expect(screen.getByText('공항 항의')).toBeInTheDocument();
    expect(screen.getByText('2개')).toBeInTheDocument();
  });

  it('만들기 버튼을 누르면 만들기 화면으로 간다', async () => {
    showScenarios([]);
    render(<RoleplayHome />);

    await userEvent.click(
      screen.getByRole('button', { name: '나만의 시나리오 만들기' }),
    );

    expect(push).toHaveBeenCalledWith('/roleplay/new');
  });

  it('카드를 누르면 그 시나리오로 다시 대화한다', async () => {
    showScenarios([scenario({ id: 7, title: '카페 주문' })]);
    render(<RoleplayHome />);

    await userEvent.click(screen.getByRole('button', { name: /카페 주문/ }));

    expect(push).toHaveBeenCalledWith('/conversation/roleplay/7');
  });
});
