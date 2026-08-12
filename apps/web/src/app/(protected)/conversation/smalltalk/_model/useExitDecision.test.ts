// 종료 의사 확인 게이트 검증 — 답을 고르기 전까지 기다리고, 고른 답이 그대로 흘러가는 것이 계약이다
import { act, renderHook } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { useExitDecision } from './useExitDecision';

describe('useExitDecision', () => {
  it('물어보면 시트가 열리고, 답하기 전까지는 결정을 기다린다', async () => {
    const { result } = renderHook(() => useExitDecision());
    const settled = vi.fn();

    act(() => {
      void result.current.ask().then(settled);
    });

    expect(result.current.asking).toBe(true);
    await Promise.resolve();
    expect(settled).not.toHaveBeenCalled();
  });

  it('답을 고르면 그 답으로 기다림이 풀리고 시트가 닫힌다', async () => {
    const { result } = renderHook(() => useExitDecision());
    const settled = vi.fn();

    act(() => {
      void result.current.ask().then(settled);
    });
    await act(async () => result.current.answer('END'));

    expect(settled).toHaveBeenCalledWith('END');
    expect(result.current.asking).toBe(false);
  });

  it('계속하기도 같은 자리로 돌아온다 — 시트를 닫는 것도 대답이다', async () => {
    // 서버는 종료 확인 상태에 멈춰 있어서, 답을 안 보내면 다음 발화가 막힌다
    const { result } = renderHook(() => useExitDecision());
    const settled = vi.fn();

    act(() => {
      void result.current.ask().then(settled);
    });
    await act(async () => result.current.answer('CONTINUE'));

    expect(settled).toHaveBeenCalledWith('CONTINUE');
  });
});
