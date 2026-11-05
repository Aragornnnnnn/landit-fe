// StepScaffold의 안드로이드 뒤로가기 — 왼쪽 위 버튼과 같은 동작을 하는지 검증
import { cleanup, render } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { runBackPress } from '@/shared/bridge/back-press';

import { StepScaffold } from './StepScaffold';

afterEach(() => cleanup());

describe('StepScaffold 뒤로가기', () => {
  it('뒤로가기를 누르면 왼쪽 위 버튼과 같은 동작을 한다', () => {
    const onBack = vi.fn();
    render(
      <StepScaffold progress={0} onBack={onBack}>
        본문
      </StepScaffold>,
    );

    runBackPress();

    expect(onBack).toHaveBeenCalledTimes(1);
  });
});
