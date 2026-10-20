// @vitest-environment jsdom
// 페이월을 떠난 순간 — 어느 단계에서, 닫기로인지 다른 길로인지, 얼마나 머물고 얼마나 내려 봤는지 남긴다. 결제·복원으로 넘어가면 남기지 않는다
import { renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { track } from '@/shared/analytics';

import { usePaywallExit } from './usePaywallExit';

vi.mock('@/shared/analytics', () => ({ track: vi.fn() }));

beforeEach(() => vi.useFakeTimers());
afterEach(() => {
  vi.useRealTimers();
  vi.mocked(track).mockClear();
});

const scrolled = (scrollTop: number) =>
  ({ scrollTop, scrollHeight: 1000, clientHeight: 400 }) as HTMLElement;

const open = () =>
  renderHook(() =>
    usePaywallExit({
      variant: 'reward',
      source: 'first_expression_tour',
      startStep: 'benefits',
    }),
  );

describe('usePaywallExit', () => {
  it('닫기로 떠나면 떠난 단계·머문 시간·가장 깊이 내려 본 비율을 남긴다', () => {
    // Given 혜택 화면을 3초 보며 절반(300/600)까지 내렸다가 다시 올라간 사람
    const { result, unmount } = open();
    vi.advanceTimersByTime(3000);
    result.current.noteScroll(scrolled(300));
    result.current.noteScroll(scrolled(0));

    // When 닫기를 누르고 화면이 사라지면
    result.current.markClose();
    unmount();

    // Then 떠남을 한 번 남긴다
    expect(track).toHaveBeenCalledWith('Paywall Exited', {
      step: 'benefits',
      trigger: 'close',
      variant: 'reward',
      paywall_source: 'first_expression_tour',
      dwell_ms: 3000,
      max_scroll_pct: 50,
    });
  });

  it('닫기 없이 화면이 사라지면(뒤로가기 등) 다른 길로 떠난 것으로 남기고, 단계를 옮기면 스크롤 깊이를 새로 잰다', () => {
    const { result, unmount } = open();
    vi.advanceTimersByTime(10);
    result.current.noteScroll(scrolled(600));
    result.current.noteStep('checkout');

    unmount();

    expect(track).toHaveBeenCalledWith(
      'Paywall Exited',
      expect.objectContaining({
        step: 'checkout',
        trigger: 'navigate',
        max_scroll_pct: 0,
      }),
    );
  });

  it('결제나 복원으로 넘어가면 떠남으로 남기지 않는다', () => {
    const { result, unmount } = open();
    vi.advanceTimersByTime(10);

    result.current.markUnlocked();
    unmount();

    expect(track).not.toHaveBeenCalled();
  });
});
