// 공통 머리의 안드로이드 뒤로가기 — 뒤로 버튼과 같은 동작을 하는지 검증
import { cleanup, render } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { runBackPress } from '@/shared/bridge/back-press';

import { BackHeader } from './BackHeader';
import { StepHeader } from './StepHeader';

afterEach(() => cleanup());

describe('공통 머리의 뒤로가기', () => {
  it.each([
    ['BackHeader', (fn: () => void) => <BackHeader onBack={fn} />],
    ['StepHeader', (fn: () => void) => <StepHeader onBack={fn} />],
  ])('%s는 뒤로가기를 뒤로 버튼 동작으로 받는다', (_name, toHeader) => {
    // Given 머리가 떠 있다
    const onBack = vi.fn();
    render(toHeader(onBack));

    // When 뒤로가기를 누르면
    const handled = runBackPress();

    // Then 버튼을 누른 것과 같다
    expect(handled).toBe(true);
    expect(onBack).toHaveBeenCalledTimes(1);
  });

  it('머리가 사라지면 뒤로가기를 받지 않는다', () => {
    const { unmount } = render(<BackHeader onBack={vi.fn()} />);

    unmount();

    expect(runBackPress()).toBe(false);
  });

  it('StepHeader 첫 단계처럼 돌아갈 곳이 없으면 뒤로가기를 넘긴다', () => {
    // Given 돌아갈 단계가 없다
    const onBack = vi.fn();
    render(<StepHeader onBack={onBack} hideBack />);

    // When 뒤로가기를 누르면
    const handled = runBackPress();

    // Then 앱 공통 처리로 넘어간다
    expect(handled).toBe(false);
    expect(onBack).not.toHaveBeenCalled();
  });
});
