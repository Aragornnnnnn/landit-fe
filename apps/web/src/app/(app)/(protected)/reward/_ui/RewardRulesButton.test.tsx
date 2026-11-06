// 환급 규칙 안내 버튼 계측 — 시트를 열 때만 찍는지
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { RewardRulesButton } from './RewardRulesButton';

const analytics = vi.hoisted(() => ({ track: vi.fn() }));
vi.mock('@/shared/analytics', () => ({ track: analytics.track }));
// 동전 그림은 보지 않는다 — 시트가 열리고 금액이 맞는지만 본다
vi.mock('next/image', () => ({ default: () => <span /> }));

afterEach(() => {
  cleanup();
  analytics.track.mockClear();
});

describe('RewardRulesButton', () => {
  it('누르면 동전 그림으로 환급이 쌓이는 모습이 시트로 열리고 한 번 찍는다', () => {
    render(<RewardRulesButton dailyWon={500} />);

    fireEvent.click(screen.getByRole('button', { name: '환급 규칙' }));

    expect(screen.getByText('이렇게 환급돼요')).toBeInTheDocument();
    expect(screen.getByText('50,000원')).toBeInTheDocument();
    expect(analytics.track.mock.calls).toEqual([['Reward Rules Opened']]);
  });

  it('닫을 때는 찍지 않는다', () => {
    render(<RewardRulesButton dailyWon={500} />);
    fireEvent.click(screen.getByRole('button', { name: '환급 규칙' }));
    analytics.track.mockClear();

    fireEvent.click(screen.getByRole('button', { name: '확인' }));

    expect(analytics.track).not.toHaveBeenCalled();
  });
});
