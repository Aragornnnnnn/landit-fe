// 롤플레이 탭 — 빈 상태와 목록의 갈림, 카드 ⋯ 시트에서 지난 대화·삭제로 이어지는 동작
import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import type { RoleplayScenario } from '@/features/roleplay/api/roleplay';
import { useDeleteRoleplayScenarioMutation } from '@/features/roleplay/model/useDeleteRoleplayScenarioMutation';
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
vi.mock('@/features/roleplay/model/useDeleteRoleplayScenarioMutation', () => ({
  useDeleteRoleplayScenarioMutation: vi.fn(),
}));

const mutate = vi.fn();

const scenario = (overrides: Partial<RoleplayScenario>): RoleplayScenario => ({
  scenarioId: 1,
  partner: 'chloe',
  myRole: '손님',
  partnerRole: '바리스타',
  situation: '주문하기',
  title: '단골 카페에서 새 메뉴 주문하기',
  lastTalkedAt: '2026-10-31T10:00:00',
  sessionCount: 3,
  ...overrides,
});

const showScenarios = (scenarios: RoleplayScenario[]) =>
  vi.mocked(useRoleplayScenariosQuery).mockReturnValue({
    scenarios,
    error: null,
    retry: vi.fn(),
  });

beforeEach(() => {
  vi.mocked(useDeleteRoleplayScenarioMutation).mockReturnValue({
    mutate,
    isPending: false,
  } as unknown as ReturnType<typeof useDeleteRoleplayScenarioMutation>);
});

afterEach(cleanup);

describe('RoleplayHome', () => {
  it('만든 시나리오가 없으면 무엇을 하는 곳인지 안내한다', () => {
    showScenarios([]);

    render(<RoleplayHome />);

    expect(screen.getByText(/머릿속에만 있던 상황을/)).toBeInTheDocument();
    expect(screen.queryByText('내 시나리오')).not.toBeInTheDocument();
  });

  it('만든 시나리오가 있으면 카드로 쌓고 개수를 보여 준다', () => {
    showScenarios([
      scenario({ scenarioId: 1, title: '카페 주문' }),
      scenario({ scenarioId: 2, title: '공항 항의' }),
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

  it('한 번도 대화하지 않은 시나리오는 지난 대화 보기가 막혀 있다', async () => {
    showScenarios([scenario({ title: '공항 항의', sessionCount: 0 })]);
    render(<RoleplayHome />);

    await userEvent.click(
      screen.getByRole('button', { name: '공항 항의 더보기' }),
    );

    expect(
      screen.getByRole('button', { name: '지난 대화 보기' }),
    ).toBeDisabled();
  });

  it('지난 대화 보기를 누르면 그 시나리오의 지난 대화 목록으로 간다', async () => {
    showScenarios([scenario({ scenarioId: 7, title: '카페 주문' })]);
    render(<RoleplayHome />);

    await userEvent.click(
      screen.getByRole('button', { name: '카페 주문 더보기' }),
    );
    await userEvent.click(
      screen.getByRole('button', { name: '지난 대화 보기' }),
    );

    expect(push).toHaveBeenCalledWith('/roleplay/7/sessions');
  });

  it('삭제하기에서 한 번 더 확인하면 그 시나리오를 지운다', async () => {
    showScenarios([scenario({ scenarioId: 7, title: '카페 주문' })]);
    render(<RoleplayHome />);

    await userEvent.click(
      screen.getByRole('button', { name: '카페 주문 더보기' }),
    );
    await userEvent.click(screen.getByRole('button', { name: '삭제하기' }));
    await userEvent.click(screen.getByRole('button', { name: '지울게요' }));

    expect(mutate).toHaveBeenCalledWith(7, expect.anything());
  });
});
