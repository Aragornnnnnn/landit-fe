// 공통 바텀 시트 검증 — 뒤로가기는 그때의 최신 onClose를, 겹쳐 열렸으면 위 시트부터 닫는다
import { cleanup, render } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { closeTopSheet } from './bottom-sheet-back';
import { BottomSheet } from './BottomSheet';

// createPortal로 document.body에 그려지는 내용이라, 테스트 사이에 명시적으로 걷어낸다
afterEach(() => cleanup());

vi.mock('motion/react', () => import('@/shared/motion/test-double'));

describe('BottomSheet', () => {
  it('다시 그려져 onClose가 바뀌면 뒤로가기는 새 onClose를 부른다', () => {
    const first = vi.fn();
    const next = vi.fn();
    const { rerender } = render(
      <BottomSheet open onClose={first}>
        내용
      </BottomSheet>,
    );
    rerender(
      <BottomSheet open onClose={next}>
        내용
      </BottomSheet>,
    );

    closeTopSheet();

    expect(first).not.toHaveBeenCalled();
    expect(next).toHaveBeenCalledTimes(1);
  });

  it('아래 시트가 다시 그려져도 뒤로가기는 위 시트부터 닫는다', () => {
    const closeBelow = vi.fn();
    const closeAbove = vi.fn();
    const renderBoth = (onCloseBelow: () => void) => (
      <>
        <BottomSheet open onClose={onCloseBelow}>
          아래
        </BottomSheet>
        <BottomSheet open onClose={closeAbove}>
          위
        </BottomSheet>
      </>
    );
    const { rerender } = render(renderBoth(() => closeBelow()));
    rerender(renderBoth(() => closeBelow()));

    closeTopSheet();

    expect(closeAbove).toHaveBeenCalledTimes(1);
    expect(closeBelow).not.toHaveBeenCalled();
  });
});
