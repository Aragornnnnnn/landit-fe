// 표현 학습 완료 뒤 환급 쪽 후속 검증 — 받은 금액을 알리고 새 환급액을 미리 받아 둔다
// @vitest-environment jsdom
import { createElement, type ReactNode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { useEarnedPop } from '@/features/reward/model/earned-pop';
import {
  rewardActivity,
  rewardReceipt,
} from '@/features/reward/model/reward.fixture';

import * as finishApi from '../api/finish';
import { useFinishExpressionMutation } from './useFinishExpressionMutation';

vi.mock('../api/finish', () => ({ finishExpression: vi.fn() }));
// 환급 미리받기는 다른 기능의 후속이라 목으로 둔다 — 여기서는 완료 때 부르는지만 본다
const refreshRewardAfterCompletion = vi.hoisted(() => vi.fn());
vi.mock('@/features/reward/model/refresh-reward', () => ({
  refreshRewardAfterCompletion,
}));

const finishExpression = vi.mocked(finishApi.finishExpression);

const finish = async ({ repeated = false } = {}) => {
  const queryClient = new QueryClient();
  const wrapper = ({ children }: { children: ReactNode }) =>
    createElement(QueryClientProvider, { client: queryClient }, children);
  const { result } = renderHook(
    () => useFinishExpressionMutation(7, { repeated }),
    { wrapper },
  );
  const outcome = await act(() => result.current.mutateAsync());
  return { queryClient, outcome };
};

// 오늘 표현을 다 끝내 마지막 몫을 받은 영수증
const lastReceipt = rewardReceipt({
  activityType: 'EXPRESSION',
  completionId: 9,
  earnedWon: 77,
  activities: [
    rewardActivity('EXPRESSION', { completed: true, completedCount: 4 }),
  ],
});

beforeEach(() => {
  finishExpression.mockReset();
  refreshRewardAfterCompletion.mockClear();
  useEarnedPop.setState({ shown: null, announced: [] });
});

describe('useFinishExpressionMutation', () => {
  it('환급 참여자가 표현을 끝내면 받은 금액을 알린다', async () => {
    finishExpression.mockResolvedValue({
      reward: rewardReceipt({ completionId: 9, earnedWon: 11 }),
    });

    await finish();

    expect(useEarnedPop.getState().shown).toEqual({
      completionId: 9,
      earnedWon: 11,
    });
  });

  it('오늘 표현을 다 끝낸 완료는 화면 위 표시 대신, 화면이 보여 줄 금액을 돌려준다', async () => {
    finishExpression.mockResolvedValue({ reward: lastReceipt });

    const { outcome } = await finish();

    expect(outcome.earned).toMatchObject({ earnedWon: 77, expressionCount: 4 });
    expect(useEarnedPop.getState().shown).toBeNull();
  });

  it('이미 끝낸 표현을 다시 한 완료는 어느 쪽으로도 알리지 않는다 — 서버가 처음 영수증을 그대로 준다', async () => {
    finishExpression.mockResolvedValue({ reward: lastReceipt });

    const { outcome } = await finish({ repeated: true });

    expect(outcome.earned).toBeNull();
    expect(useEarnedPop.getState().shown).toBeNull();
  });

  it('환급과 상관없는 사람에게는 아무것도 알리지 않는다', async () => {
    finishExpression.mockResolvedValue({});

    await finish();

    expect(useEarnedPop.getState().shown).toBeNull();
  });

  it('표현을 끝내면 새 환급액을 미리 받아 둔다', async () => {
    finishExpression.mockResolvedValue({});

    const { queryClient } = await finish();

    expect(refreshRewardAfterCompletion).toHaveBeenCalledWith(queryClient);
  });
});
