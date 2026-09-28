// 스몰톡 하루 말하기 한도 — 지금은 누구에게나 한도 없이 말한다
import { renderHook } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { useSpeakingLimit } from './useSpeakingLimit';

describe('useSpeakingLimit', () => {
  it('결제 환경과 상관없이 무제한이다', () => {
    const { result } = renderHook(() => useSpeakingLimit());

    expect(result.current.unlimited).toBe(true);
  });
});
