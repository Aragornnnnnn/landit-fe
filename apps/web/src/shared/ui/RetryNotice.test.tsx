// RetryNotice — 화면마다 흩어져 있던 재시도 계측을 이 컴포넌트가 대신 남기는지 검증
import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { RetryNotice } from './RetryNotice';

const mocks = vi.hoisted(() => ({ track: vi.fn() }));

vi.mock('@/shared/analytics', () => ({ track: mocks.track }));

afterEach(cleanup);

describe('RetryNotice', () => {
  it('다시 시도를 누르면 어느 화면의 실패였는지 남기고 재시도한다', async () => {
    const retry = vi.fn();
    render(
      <RetryNotice
        screen="scenario"
        message="편지를 불러오지 못했어요."
        onRetry={retry}
      />,
    );

    await userEvent.click(screen.getByRole('button', { name: '다시 시도' }));

    expect(mocks.track).toHaveBeenCalledWith('Error Retried', {
      screen: 'scenario',
    });
    expect(retry).toHaveBeenCalled();
  });

  it('실패를 alert으로 알린다 — 스켈레톤이 조용히 바뀌면 보조 기술이 놓친다', () => {
    render(
      <RetryNotice screen="streak" message="잠시 후 다시" onRetry={() => {}} />,
    );

    expect(screen.getByRole('alert')).toHaveTextContent('잠시 후 다시');
  });
});
