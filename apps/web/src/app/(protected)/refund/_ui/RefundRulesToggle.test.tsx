// 환급 규칙 카드 계측 — 펼칠 때만 찍는지
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { RefundRulesToggle } from './RefundRulesToggle';

const analytics = vi.hoisted(() => ({ track: vi.fn() }));
vi.mock('@/shared/analytics', () => ({ track: analytics.track }));
vi.mock('next/image', () => ({ default: () => <span /> }));

const toggle = () => screen.getByRole('button', { name: '환급 규칙' });

afterEach(cleanup);

describe('RefundRulesToggle 계측', () => {
  it('펼치면 한 번 찍는다', () => {
    render(<RefundRulesToggle />);

    fireEvent.click(toggle());

    expect(analytics.track.mock.calls).toEqual([['Reward Rules Opened']]);
  });

  it('접을 때는 찍지 않는다', () => {
    render(<RefundRulesToggle />);
    fireEvent.click(toggle());
    analytics.track.mockClear();

    fireEvent.click(toggle());

    expect(analytics.track).not.toHaveBeenCalled();
  });
});
