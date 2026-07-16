// 홈 복귀 신호의 1회 소비 계약 — 첫 배치에만 쓰이고, 카테고리 기본 선택 값은 유지된다
import { renderHook, waitFor } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { useReturnSignals } from './useReturnSignals';

const params = (search: string) => new URLSearchParams(search);

describe('useReturnSignals', () => {
  it('flip 신호를 배치(positioning)와 카테고리 선택(returnScenarioId) 양쪽에 제공한다', () => {
    const { result } = renderHook(() =>
      useReturnSignals(params('flip=3&just=1'), false),
    );

    expect(result.current.returnScenarioId).toBe(3);
    expect(result.current.positioning.flipScenarioId).toBe(3);
    expect(result.current.positioning.focusActive).toBe(true);
  });

  it('ready가 된 렌더에서는 신호를 유지하고, 커밋 후에 소비해 재발동을 막는다', async () => {
    const { result, rerender } = renderHook(
      ({ ready }) => useReturnSignals(params('flip=3'), ready),
      { initialProps: { ready: false } },
    );

    // 소비 전(데이터 로딩 중)에는 신호 유지
    expect(result.current.positioning.flipScenarioId).toBe(3);

    rerender({ ready: true });
    // ready가 된 렌더 자체에서는 아직 신호가 살아 있다 — 리스트가 이 렌더에서 배치한다
    expect(result.current.positioning.flipScenarioId).toBe(3);

    // 커밋 후 소비 — 이후 렌더(카테고리 전환·리페치)에서는 재발동하지 않는다
    await waitFor(() =>
      expect(result.current.positioning.flipScenarioId).toBeNull(),
    );
    expect(result.current.positioning.focusActive).toBe(false);
    // 카테고리 기본 선택은 소비 후에도 유지 — 첫 카테고리로 튀지 않는다
    expect(result.current.returnScenarioId).toBe(3);
  });

  it('just가 시나리오 id를 담으면 카테고리 선택에 쓴다 (레거시 just=1은 강조 전용)', () => {
    const { result } = renderHook(() =>
      useReturnSignals(params('just=7'), false),
    );
    expect(result.current.returnScenarioId).toBe(7);
    expect(result.current.positioning.focusActive).toBe(true);

    const legacy = renderHook(() => useReturnSignals(params('just=1'), false));
    expect(legacy.result.current.returnScenarioId).toBeNull();
    expect(legacy.result.current.positioning.focusActive).toBe(true);
  });

  it('card 신호는 flip이 없을 때 카테고리 선택에 쓴다', () => {
    const { result } = renderHook(() =>
      useReturnSignals(params('card=5'), false),
    );
    expect(result.current.returnScenarioId).toBe(5);
    expect(result.current.positioning.cardScenarioId).toBe(5);
  });

  it('신호가 없으면 전부 비어 있다', () => {
    const { result } = renderHook(() => useReturnSignals(params(''), true));
    expect(result.current.returnScenarioId).toBeNull();
    expect(result.current.positioning.flipScenarioId).toBeNull();
    expect(result.current.positioning.cardScenarioId).toBeNull();
    expect(result.current.positioning.focusActive).toBe(false);
  });
});
