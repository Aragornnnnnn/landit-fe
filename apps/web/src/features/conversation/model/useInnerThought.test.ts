// 속마음 폴링 훅 검증 — 제출 응답에 속마음이 비어 온 경우의 폴백
import { renderHook } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import type { SubmittedMessage } from '../api/session';
import { useInnerThought } from './useInnerThought';

const submitted = (over: Partial<SubmittedMessage> = {}): SubmittedMessage => ({
  messageId: 1,
  turnNumber: 1,
  messageSequence: 2,
  role: 'USER',
  innerThoughtProcessingStatus: 'COMPLETED',
  innerThought: '또렷하게 잘 말했어.',
  innerThoughtType: 'GOOD',
  ...over,
});

describe('useInnerThought', () => {
  it('준비가 끝났는데 속마음이 비어 있으면 빈 문자열로 돌려준다', async () => {
    // given — 스몰톡은 아직 생성 중인 속마음을 null로 내려준다
    const { result } = renderHook(() => useInnerThought());

    const resolved = await result.current.resolve(
      7,
      submitted({ innerThought: null, innerThoughtType: null }),
    );

    // 빈 말풍선을 띄우는 대신 호출부가 다음 턴으로 건너뛸 수 있게 빈 텍스트를 준다
    expect(resolved).toEqual({ text: '', type: null });
  });
});
