// useTopicPicker — 주제 고르기를 열 때와 새로고침할 때 주제를 다시 받아오고, 못 받으면 알린다
import { act, renderHook } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { track } from '@/shared/analytics';
import { showToast } from '@/shared/ui/toast';

import { useTopicPicker } from './useTopicPicker';

vi.mock('@/shared/analytics', () => ({ track: vi.fn() }));
vi.mock('@/shared/ui/toast', () => ({ showToast: vi.fn() }));

const succeeds = () => vi.fn().mockResolvedValue({ isError: false });
const fails = () => vi.fn().mockResolvedValue({ isError: true });

describe('useTopicPicker', () => {
  it('주제 고르기를 열면 주제를 다시 받아온다', async () => {
    // given — 캐시에 남은 주제가 아니라 새 주제를 보여줘야 한다
    const refresh = succeeds();
    const { result } = renderHook(() =>
      useTopicPicker({ partner: 'chloe', refresh }),
    );

    // when
    await act(async () => result.current.openPicker());

    // then
    expect(result.current.isOpen).toBe(true);
    expect(refresh).toHaveBeenCalledTimes(1);
  });

  it('열기만 한 것은 새로고침으로 세지 않는다', async () => {
    const { result } = renderHook(() =>
      useTopicPicker({ partner: 'chloe', refresh: succeeds() }),
    );

    await act(async () => result.current.openPicker());

    expect(track).not.toHaveBeenCalled();
  });

  it('새로고침하면 주제를 다시 받고 누른 것을 남긴다', async () => {
    const refresh = succeeds();
    const { result } = renderHook(() =>
      useTopicPicker({ partner: 'marco', refresh }),
    );

    await act(async () => result.current.refreshTopics());

    expect(refresh).toHaveBeenCalledTimes(1);
    expect(track).toHaveBeenCalledWith('Small Talk Topics Refreshed', {
      partner: 'marco',
    });
  });

  it('주제를 받아오지 못하면 알린다 — 보던 주제는 화면에 그대로 남는다', async () => {
    const { result } = renderHook(() =>
      useTopicPicker({ partner: 'chloe', refresh: fails() }),
    );
    await act(async () => result.current.openPicker());

    await act(async () => result.current.refreshTopics());

    expect(showToast).toHaveBeenCalledWith('주제를 받아오지 못했어요');
  });

  it('닫은 뒤에 실패가 돌아오면 알리지 않는다 — 이미 다른 화면을 보고 있다', async () => {
    // given — 실패가 늦게(재시도를 다 쓰고) 돌아오는 조회
    let settle = (_: { isError: boolean }) => {};
    const refresh = vi.fn(
      () => new Promise<{ isError: boolean }>((resolve) => (settle = resolve)),
    );
    const { result } = renderHook(() =>
      useTopicPicker({ partner: 'chloe', refresh }),
    );

    // when — 열어서 받는 중에 닫고, 그 뒤에 실패가 돌아온다
    act(() => void result.current.openPicker());
    act(() => result.current.closePicker());
    await act(async () => settle({ isError: true }));

    // then
    expect(showToast).not.toHaveBeenCalled();
  });
});
