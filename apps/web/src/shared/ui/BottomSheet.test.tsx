// 공통 바텀 시트 검증 — 닫는 길(뒤로가기·Escape·배경), 겹친 시트 순서, 스크린 리더 이름과 포커스
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
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

  it('제목을 이름으로 하는 대화 상자로 읽힌다', () => {
    render(
      <BottomSheet open onClose={vi.fn()}>
        <BottomSheet.Title>말하기 속도</BottomSheet.Title>
      </BottomSheet>,
    );

    const sheet = screen.getByRole('dialog', { name: '말하기 속도' });

    expect(sheet).toHaveAttribute('aria-modal', 'true');
  });

  it('Escape를 누르면 닫힌다', () => {
    const onClose = vi.fn();
    render(
      <BottomSheet open onClose={onClose}>
        내용
      </BottomSheet>,
    );

    fireEvent.keyDown(window, { key: 'Escape' });

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('배경을 누르면 닫힌다', () => {
    const onClose = vi.fn();
    render(
      <BottomSheet open onClose={onClose}>
        내용
      </BottomSheet>,
    );

    fireEvent.click(screen.getByTestId('bottom-sheet-dim'));

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('열리면 포커스가 시트로 옮겨 간다', () => {
    render(
      <BottomSheet open onClose={vi.fn()}>
        <BottomSheet.Title>진동</BottomSheet.Title>
      </BottomSheet>,
    );

    expect(document.activeElement).toBe(screen.getByRole('dialog'));
  });

  it('열릴 때 안에서 먼저 포커스를 받은 입력칸은 그대로 둔다', () => {
    render(
      <BottomSheet open onClose={vi.fn()}>
        <BottomSheet.Title>뭐라고 불러드릴까요?</BottomSheet.Title>
        <input aria-label="닉네임" autoFocus />
      </BottomSheet>,
    );

    expect(document.activeElement).toBe(screen.getByLabelText('닉네임'));
  });

  it('열려 있는 동안 Tab으로 마지막 버튼 다음에서 첫 버튼으로 돈다', () => {
    render(
      <BottomSheet open onClose={vi.fn()}>
        <button type="button">첫째</button>
        <button type="button">둘째</button>
      </BottomSheet>,
    );
    screen.getByRole('button', { name: '둘째' }).focus();

    fireEvent.keyDown(window, { key: 'Tab' });

    expect(document.activeElement).toBe(
      screen.getByRole('button', { name: '첫째' }),
    );
  });

  it('한글 조합 중에 Escape를 누르면 닫지 않는다', () => {
    const onClose = vi.fn();
    render(
      <BottomSheet open onClose={onClose}>
        내용
      </BottomSheet>,
    );

    fireEvent.keyDown(window, { key: 'Escape', isComposing: true });

    expect(onClose).not.toHaveBeenCalled();
  });

  it('닫히면 열기 전에 포커스했던 요소로 돌아간다', () => {
    const opener = document.createElement('button');
    document.body.appendChild(opener);
    opener.focus();
    const { rerender } = render(
      <BottomSheet open onClose={vi.fn()}>
        내용
      </BottomSheet>,
    );

    rerender(
      <BottomSheet open={false} onClose={vi.fn()}>
        내용
      </BottomSheet>,
    );

    expect(document.activeElement).toBe(opener);
    opener.remove();
  });

  it('두 시트가 겹쳐 열려 있으면 Escape 한 번에 위 시트만 닫는다', () => {
    const closeBelow = vi.fn();
    const closeAbove = vi.fn();
    render(
      <>
        <BottomSheet open onClose={closeBelow}>
          아래
        </BottomSheet>
        <BottomSheet open onClose={closeAbove}>
          위
        </BottomSheet>
      </>,
    );

    fireEvent.keyDown(window, { key: 'Escape' });

    expect(closeAbove).toHaveBeenCalledTimes(1);
    expect(closeBelow).not.toHaveBeenCalled();
  });
});
