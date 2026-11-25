// 속마음 폴링 훅 검증 — 제출 응답에 속마음이 비어 온 경우의 폴백
// @vitest-environment jsdom
import { renderHook } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import type { SubmittedMessage } from '../api/session';
import * as sessionApi from '../api/session';
import { innerThoughtPollMs } from './pacing';
import { useInnerThought } from './useInnerThought';

vi.mock('../api/session', () => ({ getInnerThought: vi.fn() }));
vi.mock('@/shared/monitoring/report', () => ({ reportWarning: vi.fn() }));

const getInnerThought = vi.mocked(sessionApi.getInnerThought);

afterEach(() => {
  vi.useRealTimers();
  getInnerThought.mockReset();
});

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
    expect(resolved).toEqual({ text: '', type: null, emotion: null });
  });

  it('폴링하다 생성이 실패하면 제출 응답 값으로 물러선다 — 그때도 속마음이 없으면 빈 문자열이다', async () => {
    // given — 아직 만드는 중이라 폴링에 들어가고, 서버가 실패로 답한다
    vi.useFakeTimers();
    getInnerThought.mockResolvedValue({
      processingStatus: 'FAILED',
      innerThought: null,
      innerThoughtType: null,
    });
    const { result } = renderHook(() => useInnerThought());

    const resolving = result.current.resolve(
      7,
      submitted({
        innerThoughtProcessingStatus: 'PREPARING',
        innerThought: null,
        innerThoughtType: null,
      }),
    );
    await vi.advanceTimersByTimeAsync(innerThoughtPollMs);

    // 실패해도 호출부가 다음 턴으로 넘어갈 수 있게 빈 텍스트를 준다
    await expect(resolving).resolves.toEqual({
      text: '',
      type: null,
      emotion: null,
    });
  });
  it('제출 응답에 준비된 속마음의 감정이 있으면 함께 돌려준다', async () => {
    // given
    const { result } = renderHook(() => useInnerThought());

    // when
    const resolved = await result.current.resolve(
      7,
      submitted({ emotion: 'LOVE' }),
    );

    // then
    expect(resolved?.emotion).toBe('LOVE');
  });

  it('폴링으로 받은 속마음의 감정을 함께 돌려준다', async () => {
    // given
    vi.useFakeTimers();
    getInnerThought.mockResolvedValue({
      processingStatus: 'COMPLETED',
      innerThought: '귀엽다.',
      innerThoughtType: 'GOOD',
      emotion: 'SULKY',
    });
    const { result } = renderHook(() => useInnerThought());

    // when
    const resolving = result.current.resolve(
      7,
      submitted({
        innerThoughtProcessingStatus: 'PREPARING',
        innerThought: null,
        innerThoughtType: null,
      }),
    );
    await vi.advanceTimersByTimeAsync(innerThoughtPollMs);

    // then
    await expect(resolving).resolves.toMatchObject({ emotion: 'SULKY' });
  });

  it.each([
    ['화면을 떠나면', (r: { unmount: () => void }) => r.unmount()],
    [
      '대화를 접으면',
      (r: { result: { current: { cancel: () => void } } }) =>
        r.result.current.cancel(),
    ],
  ] as const)(
    '%s 더는 살아 있지 않다고 알린다 — 늦게 도는 타이머가 떠난 화면을 건드리지 않게',
    (_, leave) => {
      const rendered = renderHook(() => useInnerThought());
      const { isActive } = rendered.result.current;

      leave(rendered as never);

      expect(isActive()).toBe(false);
    },
  );
});
