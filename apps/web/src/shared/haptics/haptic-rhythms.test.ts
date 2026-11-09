// hapticRhythm — 진동 여러 개를 정한 박자에 이어 울리고, 도중에 끄거나 막으면 그동안의 박자는 건너뛴다
// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { postToNative } from '@/shared/bridge/web-bridge';

import { HAPTIC_RHYTHMS } from './haptic-rhythms';
import { hapticRhythm, muteHaptics } from './haptics';
import { setHapticsEnabled } from './haptics-setting';

vi.mock('@/shared/bridge/web-bridge', () => ({
  postToNative: vi.fn(() => true),
}));
vi.mock('@/shared/bridge/native-context', () => ({
  getNativeContextSnapshot: () => null,
}));

const sentPatterns = () =>
  vi
    .mocked(postToNative)
    .mock.calls.map(([message]) =>
      message.type === 'HAPTIC' ? message.pattern : null,
    );

// 팡 — 쾅(0) · 쾅(100) · 성공(230)
const BURST = HAPTIC_RHYTHMS.burst;
const BURST_LENGTH = 230;

beforeEach(() => {
  vi.useFakeTimers();
  vi.mocked(postToNative).mockClear();
});

afterEach(() => {
  vi.useRealTimers();
  setHapticsEnabled(true);
});

describe('hapticRhythm', () => {
  it('부른 순간 첫 박자가 울린다', () => {
    hapticRhythm('burst');

    expect(sentPatterns()).toEqual([BURST[0].pattern]);
  });

  it('나머지 박자는 정한 시각에 차례로 울린다', () => {
    hapticRhythm('burst');

    vi.advanceTimersByTime(BURST_LENGTH);

    expect(sentPatterns()).toEqual(BURST.map(({ pattern }) => pattern));
  });

  it('startAt을 주면 그만큼 기다렸다 시작한다', () => {
    hapticRhythm('burst', { startAt: 500 });

    vi.advanceTimersByTime(499);
    expect(sentPatterns()).toEqual([]);
    vi.advanceTimersByTime(1);
    expect(sentPatterns()).toEqual([BURST[0].pattern]);
  });

  it('endAt을 주면 마지막 박자가 그 시각에 울린다', () => {
    hapticRhythm('burst', { endAt: 1000 });

    vi.advanceTimersByTime(999);
    expect(sentPatterns()).toHaveLength(BURST.length - 1);
    vi.advanceTimersByTime(1);
    expect(sentPatterns()).toHaveLength(BURST.length);
  });

  it('endAt이 리듬보다 짧으면 기다리지 않고 바로 시작한다', () => {
    hapticRhythm('burst', { endAt: 100 });

    expect(sentPatterns()).toEqual([BURST[0].pattern]);
  });

  it('돌려받은 함수를 부르면 아직 시작 전이어도 아무 박자도 울리지 않는다', () => {
    const stop = hapticRhythm('burst', { startAt: 500 });

    stop();
    vi.runAllTimers();

    expect(sentPatterns()).toEqual([]);
  });

  it('돌려받은 함수를 부르면 남은 박자는 울리지 않는다', () => {
    const stop = hapticRhythm('burst');

    stop();
    vi.runAllTimers();

    expect(sentPatterns()).toEqual([BURST[0].pattern]);
  });

  it('진동을 꺼 두면 아무 박자도 울리지 않는다', () => {
    setHapticsEnabled(false);

    hapticRhythm('burst');
    vi.runAllTimers();

    expect(sentPatterns()).toEqual([]);
  });

  it('녹음으로 막힌 동안의 박자는 건너뛰고, 풀린 뒤의 박자는 울린다', () => {
    hapticRhythm('burst');
    const unmute = muteHaptics();
    vi.advanceTimersByTime(150);
    unmute();

    vi.runAllTimers();

    expect(sentPatterns()).toEqual([BURST[0].pattern, BURST[2].pattern]);
  });

  it.each(Object.entries(HAPTIC_RHYTHMS))(
    '%s 리듬은 0ms에서 시작해 시각이 늘어나는 순서로 적혀 있다',
    (_, beats) => {
      const times = beats.map(({ at }) => at);

      expect(times[0]).toBe(0);
      expect(times).toEqual([...times].sort((a, b) => a - b));
    },
  );
});
