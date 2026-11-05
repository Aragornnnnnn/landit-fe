// 복습 시작 안내의 안드로이드 뒤로가기 — X와 같게 복습을 떠나는지 검증
import { cleanup, render } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { runBackPress } from '@/shared/bridge/back-press';

import { ReviewIntro } from './ReviewIntro';

vi.mock('next/image', () => ({ default: () => null }));

afterEach(() => cleanup());

describe('ReviewIntro', () => {
  it('뒤로가기를 누르면 X처럼 닫는다', () => {
    const onClose = vi.fn();
    render(
      <ReviewIntro onStart={vi.fn()} starting={false} onClose={onClose} />,
    );

    runBackPress();

    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
