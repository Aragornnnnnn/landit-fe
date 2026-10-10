// 가짜 환급 내역 — 이어 받기·실패·끝을 서버 없이 흉내 내는지
// @vitest-environment jsdom
import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { fakeHistoryItems, RECORD_CASES } from './refund-check-cases';
import { useFakeHistory } from './useFakeHistory';

const ITEMS = fakeHistoryItems(RECORD_CASES.ended.reward);

beforeEach(() => {
  vi.useFakeTimers();
});
afterEach(() => {
  vi.useRealTimers();
});

const loadOnePage = (result: {
  current: ReturnType<typeof useFakeHistory>;
}) => {
  act(() => result.current.loadMore());
  act(() => {
    vi.runAllTimers();
  });
};

describe('useFakeHistory', () => {
  it('이어 받는 동안에는 받는 중이라고 한다', () => {
    const { result } = renderHook(() => useFakeHistory(ITEMS, 'pages'));

    act(() => result.current.loadMore());

    expect(result.current.loadingMore).toBe(true);
  });

  it('이어 받으면 잠시 뒤 줄이 늘어난다', () => {
    const { result } = renderHook(() => useFakeHistory(ITEMS, 'pages'));
    const firstPage = result.current.rows!.length;

    loadOnePage(result);

    expect(result.current.loadingMore).toBe(false);
    expect(result.current.rows!.length).toBeGreaterThan(firstPage);
  });

  it('끝까지 받으면 더 받을 것이 없다고 한다', () => {
    const { result } = renderHook(() => useFakeHistory(ITEMS, 'pages'));

    loadOnePage(result);
    loadOnePage(result);

    expect(result.current.rows).toHaveLength(ITEMS.length);
    expect(result.current.hasMore).toBe(false);
  });

  it('실패 케이스는 처음 이어 받을 때 실패하고 보던 줄은 그대로 둔다', () => {
    const { result } = renderHook(() => useFakeHistory(ITEMS, 'failOnce'));
    const firstPage = result.current.rows!.length;

    loadOnePage(result);

    expect(result.current.moreFailed).toBe(true);
    expect(result.current.rows).toHaveLength(firstPage);
  });

  it('실패한 뒤 다시 받으면 이어진다', () => {
    const { result } = renderHook(() => useFakeHistory(ITEMS, 'failOnce'));
    const firstPage = result.current.rows!.length;
    loadOnePage(result);

    loadOnePage(result);

    expect(result.current.moreFailed).toBe(false);
    expect(result.current.rows!.length).toBeGreaterThan(firstPage);
  });

  it('내역 없음 케이스는 줄도 더 받을 것도 없다', () => {
    const { result } = renderHook(() => useFakeHistory(ITEMS, 'empty'));

    expect(result.current.rows).toEqual([]);
    expect(result.current.hasMore).toBe(false);
  });
});
