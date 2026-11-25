// 속마음 기다리기 — 상한 안에 오면 속마음과 함께, 넘으면 뼈대로 먼저 시작하고 도착하면 채우는 갈림길을 검증한다
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { raceThought } from './thought-race';
import type { ResolvedThought } from './useInnerThought';

const WAIT_MS = 3000;

// 원하는 때에 결과를 내주는 속마음 조회
const deferred = () => {
  let resolve!: (value: ResolvedThought | null) => void;
  const promise = new Promise<ResolvedThought | null>((r) => {
    resolve = r;
  });
  return { promise, resolve };
};

const setup = (cancelled = false) => {
  const thought = deferred();
  const onStart = vi.fn();
  const onArrive = vi.fn();
  raceThought({
    thought: thought.promise,
    waitMs: WAIT_MS,
    onStart,
    onArrive,
    isCancelled: () => cancelled,
  });
  return { thought, onStart, onArrive };
};

beforeEach(() => vi.useFakeTimers());
afterEach(() => vi.useRealTimers());

describe('raceThought', () => {
  it('상한 안에 속마음이 오면 속마음을 들고 바로 시작한다', async () => {
    const { thought, onStart, onArrive } = setup();

    thought.resolve({ text: '반갑네.', type: 'GOOD', emotion: null });
    await vi.advanceTimersByTimeAsync(0);

    expect(onStart).toHaveBeenCalledExactlyOnceWith({
      status: 'shown',
      text: '반갑네.',
      type: 'GOOD',
      emotion: null,
    });
    await vi.advanceTimersByTimeAsync(WAIT_MS);
    expect(onStart).toHaveBeenCalledTimes(1);
    expect(onArrive).not.toHaveBeenCalled();
  });

  it('상한 안에 빈 속마음이 오면 줄 없이 바로 시작한다', async () => {
    const { thought, onStart } = setup();

    thought.resolve({ text: '', type: null, emotion: null });
    await vi.advanceTimersByTimeAsync(0);

    expect(onStart).toHaveBeenCalledExactlyOnceWith(null);
  });

  it('상한을 넘기면 뼈대로 먼저 시작하고, 도착하면 그 자리를 채운다', async () => {
    const { thought, onStart, onArrive } = setup();

    await vi.advanceTimersByTimeAsync(WAIT_MS);
    expect(onStart).toHaveBeenCalledExactlyOnceWith({ status: 'pending' });

    thought.resolve({ text: '좀 머쓱하네.', type: 'BAD', emotion: null });
    await vi.advanceTimersByTimeAsync(0);
    expect(onArrive).toHaveBeenCalledExactlyOnceWith({
      status: 'shown',
      text: '좀 머쓱하네.',
      type: 'BAD',
      emotion: null,
    });
  });

  it('뼈대로 시작한 뒤 속마음이 끝내 비어 오면 그 줄을 뺀다', async () => {
    const { thought, onArrive } = setup();

    await vi.advanceTimersByTimeAsync(WAIT_MS);
    thought.resolve({ text: '', type: null, emotion: null });
    await vi.advanceTimersByTimeAsync(0);

    expect(onArrive).toHaveBeenCalledExactlyOnceWith(null);
  });

  it('속마음 감정은 줄에 그대로 실어 표정이 고를 수 있게 한다', async () => {
    // Given 감정이 붙은 속마음이 상한 안에 오면
    const { thought, onStart } = setup();

    // When
    thought.resolve({ text: '흥.', type: 'BAD', emotion: 'SULKY' });
    await vi.advanceTimersByTimeAsync(0);

    // Then
    expect(onStart).toHaveBeenCalledWith({
      status: 'shown',
      text: '흥.',
      type: 'BAD',
      emotion: 'SULKY',
    });
  });

  it('모르는 속마음 종류는 보통으로 읽는다', async () => {
    const { thought, onStart } = setup();

    thought.resolve({ text: '음.', type: 'SURPRISED', emotion: null });
    await vi.advanceTimersByTimeAsync(0);

    expect(onStart).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'NORMAL' }),
    );
  });

  it('대화를 떠나 조회가 멈추면 상한이 지나도 시작하지 않는다', async () => {
    const { thought, onStart, onArrive } = setup();

    thought.resolve(null);
    await vi.advanceTimersByTimeAsync(WAIT_MS);

    expect(onStart).not.toHaveBeenCalled();
    expect(onArrive).not.toHaveBeenCalled();
  });

  it('대화를 떠난 뒤엔 상한이 지나도 뼈대로 시작하지 않는다', async () => {
    const { onStart } = setup(true);

    await vi.advanceTimersByTimeAsync(WAIT_MS);

    expect(onStart).not.toHaveBeenCalled();
  });
});
