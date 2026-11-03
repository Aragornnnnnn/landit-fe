// 롤플레이 탭 — 빈 상태와 목록의 갈림, 카드와 만들기 버튼이 보내는 곳
import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import type { RoleplaySettings } from '@/features/roleplay/api/roleplay';
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

const track = vi.hoisted(() => vi.fn());
vi.mock('@/shared/analytics', () => ({ track }));
vi.mock('@/features/roleplay/model/useDeleteRoleplayScenarioMutation', () => ({
  useDeleteRoleplayScenarioMutation: vi.fn(),
}));

type DeleteCallbacks = { onSuccess?: () => void; onError?: () => void };

// 삭제 뮤테이션은 경계다 — 부르면 바로 성공·실패 콜백을 돌려준다
const answerDelete = (result: 'success' | 'error') => {
  const mutate = vi.fn((_id: number, callbacks: DeleteCallbacks) => {
    if (result === 'success') callbacks.onSuccess?.();
    else callbacks.onError?.();
  });
  vi.mocked(useDeleteRoleplayScenarioMutation).mockReturnValue({
    mutate,
    isPending: false,
  } as unknown as ReturnType<typeof useDeleteRoleplayScenarioMutation>);
  return mutate;
};

const scenario = (overrides: Partial<RoleplaySettings>): RoleplaySettings => ({
  id: 1,
  characterId: 'chloe',
  title: '단골 카페에서 새 메뉴 주문하기',
  userRole: '손님',
  aiRole: '바리스타',
  situation: '주문하기',
  createdAt: '2026-10-31T10:00:00',
  lastPlayedAt: null,
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

beforeEach(() => {
  answerDelete('success');
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

    await userEvent.click(
      screen.getByRole('button', { name: /카페 주문(?! 더보기)/ }),
    );

    expect(push).toHaveBeenCalledWith('/conversation/roleplay/7');
  });

  const openMore = async (title: string) =>
    userEvent.click(screen.getByRole('button', { name: `${title} 더보기` }));

  it('대화한 적 있는 시나리오는 ⋯에서 지난 대화 목록으로 갈 수 있다', async () => {
    showScenarios([
      scenario({
        id: 7,
        title: '카페 주문',
        lastPlayedAt: '2026-11-01T10:00:00',
      }),
    ]);
    render(<RoleplayHome />);

    await openMore('카페 주문');
    await userEvent.click(
      screen.getByRole('button', { name: '지난 대화 보기' }),
    );

    expect(push).toHaveBeenCalledWith('/roleplay/7/sessions');
  });

  it('끝낸 대화가 없는 시나리오는 지난 대화 보기를 막는다', async () => {
    showScenarios([
      scenario({ id: 7, title: '카페 주문', lastPlayedAt: null }),
    ]);
    render(<RoleplayHome />);

    await openMore('카페 주문');

    expect(
      screen.getByRole('button', { name: '지난 대화 보기' }),
    ).toBeDisabled();
  });

  it('삭제를 확인해야 그 시나리오를 지운다', async () => {
    const mutate = answerDelete('success');
    showScenarios([scenario({ id: 7, title: '카페 주문' })]);
    render(<RoleplayHome />);

    await openMore('카페 주문');
    await userEvent.click(screen.getByRole('button', { name: '삭제하기' }));
    expect(mutate).not.toHaveBeenCalled();
    await userEvent.click(screen.getByRole('button', { name: '지울게요' }));

    expect(mutate).toHaveBeenCalledWith(7, expect.anything());
    expect(track).toHaveBeenCalledWith('Roleplay Deleted', {
      roleplay_id: 7,
      has_history: false,
    });
  });

  it('대화한 적 있는 시나리오를 지울 땐 지난 대화도 사라진다고 알린다', async () => {
    showScenarios([
      scenario({
        id: 7,
        title: '카페 주문',
        lastPlayedAt: '2026-11-01T10:00:00',
      }),
    ]);
    render(<RoleplayHome />);

    await openMore('카페 주문');
    await userEvent.click(screen.getByRole('button', { name: '삭제하기' }));

    expect(
      screen.getByText(/지난 대화와 피드백도 함께 사라져요/),
    ).toBeInTheDocument();
  });

  it('지우기에 실패하면 확인 시트를 그대로 둔다', async () => {
    answerDelete('error');
    showScenarios([scenario({ id: 7, title: '카페 주문' })]);
    render(<RoleplayHome />);

    await openMore('카페 주문');
    await userEvent.click(screen.getByRole('button', { name: '삭제하기' }));
    await userEvent.click(screen.getByRole('button', { name: '지울게요' }));

    expect(screen.getByText('이 시나리오를 지울까요?')).toBeInTheDocument();
  });

  it('시트를 연 뒤 목록이 새로 오면 새 값으로 그린다 — 첫 대화 직후 옛 목록에서 열어도 지난 대화를 볼 수 있다', async () => {
    showScenarios([
      scenario({ id: 7, title: '카페 주문', lastPlayedAt: null }),
    ]);
    const { rerender } = render(<RoleplayHome />);
    await openMore('카페 주문');

    showScenarios([
      scenario({
        id: 7,
        title: '카페 주문',
        lastPlayedAt: '2026-11-01T10:00:00',
      }),
    ]);
    rerender(<RoleplayHome />);

    expect(
      screen.getByRole('button', { name: '지난 대화 보기' }),
    ).toBeEnabled();
  });
});
