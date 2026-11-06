// PageHeader의 안드로이드 뒤로가기 — 뒤로 버튼과 같게 동작하고, 버튼이 잠긴 동안은 머무는지 검증
import { cleanup, render } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { runBackPress } from '@/shared/bridge/back-press';

import { PageHeader } from './PageHeader';

afterEach(() => cleanup());

describe('PageHeader 뒤로가기', () => {
  it('뒤로가기를 누르면 뒤로 버튼과 같은 동작을 한다', () => {
    const onBack = vi.fn();
    render(<PageHeader title="제목" onBack={onBack} />);

    runBackPress();

    expect(onBack).toHaveBeenCalledTimes(1);
  });

  it('버튼이 잠겨 있으면 뒤로가기도 아무 일을 하지 않고 화면에 머문다', () => {
    // Given 나가는 중이라 버튼이 잠겼다
    const onBack = vi.fn();
    render(<PageHeader title="제목" onBack={onBack} backDisabled />);

    // When 뒤로가기를 누르면
    const handled = runBackPress();

    // Then 처리한 것으로 끝나고 다시 나가지 않는다
    expect(handled).toBe(true);
    expect(onBack).not.toHaveBeenCalled();
  });
});
