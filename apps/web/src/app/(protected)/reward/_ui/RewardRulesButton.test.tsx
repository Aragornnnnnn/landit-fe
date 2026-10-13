// 환급 규칙 안내 버튼 계측 — 시트를 열 때만 찍는지
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { RewardRulesButton } from './RewardRulesButton';

const analytics = vi.hoisted(() => ({ track: vi.fn() }));
vi.mock('@/shared/analytics', () => ({ track: analytics.track }));

afterEach(() => {
  cleanup();
  analytics.track.mockClear();
});

describe('RewardRulesButton', () => {
  it('누르면 규칙이 시트로 열리고 한 번 찍는다', () => {
    render(<RewardRulesButton dailyWon={500} />);

    fireEvent.click(screen.getByRole('button', { name: '환급 규칙' }));

    expect(
      screen.getByText('매일 오늘의 시나리오를 하면 최대 500원이 쌓여요'),
    ).toBeInTheDocument();
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
