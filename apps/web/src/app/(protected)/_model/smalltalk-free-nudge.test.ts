// 스몰톡 칩 말풍선 차례 알림 — 탭 셸이 켜고 끄면 홈 화면이 바로 아는지 검증
// @vitest-environment jsdom
import { act, renderHook } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';

import { setFreeNudgeFirst, useFreeNudgeFirst } from './smalltalk-free-nudge';

afterEach(() => setFreeNudgeFirst(false));

describe('useFreeNudgeFirst', () => {
  it('탭 셸이 말풍선 차례라고 알리면 참이 되고, 거두면 거짓이 된다', () => {
    // Given 홈 화면이 지켜보고 있을 때
    const { result } = renderHook(() => useFreeNudgeFirst());
    expect(result.current).toBe(false);

    // When 탭 셸이 말풍선 차례라고 알리면
    act(() => setFreeNudgeFirst(true));

    // Then 홈 화면의 시트들이 기다릴 수 있다
    expect(result.current).toBe(true);

    // When 말풍선이 꺼지면
    act(() => setFreeNudgeFirst(false));

    // Then 시트들이 나선다
    expect(result.current).toBe(false);
  });
});
