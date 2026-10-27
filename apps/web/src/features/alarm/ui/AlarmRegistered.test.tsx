// 알람 등록 완료 화면 검증 — 연출 도중 부모가 다시 그려져도 넘어갈 시계를 처음부터 다시 재지 않는다
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { setTestLocale } from '@/shared/i18n/test-locale';

import { AlarmRegistered } from './AlarmRegistered';

vi.mock('motion/react', () => import('@/shared/motion/test-double'));

const time = { hour: 9, minute: 0 };
// 화면이 다음으로 넘어가는 시각 — AlarmRegistered의 LEAVE_AFTER_MS와 같다
const LEAVE_AFTER_MS = 3800;
const RERENDER_AT_MS = 2000;

beforeEach(() => vi.useFakeTimers());
afterEach(() => {
  cleanup();
  vi.useRealTimers();
});

describe('AlarmRegistered', () => {
  it('일본어 화면에서 권한이 막혔으면 일본어 시각으로 켜기를 권한다', () => {
    // given
    setTestLocale('ja');

    // when
    render(
      <AlarmRegistered
        time={time}
        blocked
        onUnblock={vi.fn()}
        onDone={vi.fn()}
      />,
    );

    // then
    expect(
      screen.getByText('権限オンで毎日午前9時にお知らせします'),
    ).toBeInTheDocument();
  });

  it('연출 도중 onDone이 바뀌어도 처음 시계대로 새 onDone으로 넘어간다', () => {
    const first = vi.fn();
    const next = vi.fn();
    const { rerender } = render(
      <AlarmRegistered
        time={time}
        blocked={false}
        onUnblock={vi.fn()}
        onDone={first}
      />,
    );
    vi.advanceTimersByTime(RERENDER_AT_MS);

    rerender(
      <AlarmRegistered
        time={time}
        blocked={false}
        onUnblock={vi.fn()}
        onDone={next}
      />,
    );
    vi.advanceTimersByTime(LEAVE_AFTER_MS - RERENDER_AT_MS);

    expect(first).not.toHaveBeenCalled();
    expect(next).toHaveBeenCalledTimes(1);
  });
});
