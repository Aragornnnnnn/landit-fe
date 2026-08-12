import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { closeTopSheet } from './bottom-sheet-back';
import { Modal } from './Modal';

// createPortal로 document.body에 그려지는 내용이라, 테스트 사이에 명시적으로 걷어낸다
afterEach(() => cleanup());

// 연출은 순수 DOM으로 치환한다 — 대역이 하는 일은 shared/motion/test-double 참고
vi.mock('motion/react', () => import('@/shared/motion/test-double'));

describe('Modal', () => {
  it('open이 false면 아무것도 렌더링하지 않는다', () => {
    render(
      <Modal open={false} onClose={vi.fn()}>
        내용
      </Modal>,
    );

    expect(screen.queryByText('내용')).not.toBeInTheDocument();
  });

  it('dismissible 기본값(true)에서 배경을 클릭하면 onClose가 호출된다', () => {
    const onClose = vi.fn();
    render(
      <Modal open onClose={onClose}>
        내용
      </Modal>,
    );

    fireEvent.click(screen.getByTestId('modal-backdrop'));

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('dismissible=false면 배경을 클릭해도 onClose가 호출되지 않는다', () => {
    const onClose = vi.fn();
    render(
      <Modal open onClose={onClose} dismissible={false}>
        내용
      </Modal>,
    );

    fireEvent.click(screen.getByTestId('modal-backdrop'));

    expect(onClose).not.toHaveBeenCalled();
  });

  it('dismissible 기본값(true)에서 Escape를 누르면 onClose가 호출된다', () => {
    const onClose = vi.fn();
    render(
      <Modal open onClose={onClose}>
        내용
      </Modal>,
    );

    fireEvent.keyDown(window, { key: 'Escape' });

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('dismissible=false면 Escape를 눌러도 onClose가 호출되지 않는다', () => {
    const onClose = vi.fn();
    render(
      <Modal open onClose={onClose} dismissible={false}>
        내용
      </Modal>,
    );

    fireEvent.keyDown(window, { key: 'Escape' });

    expect(onClose).not.toHaveBeenCalled();
  });

  it('dismissible 기본값(true)에서 네이티브 뒤로가기로 닫힌다', () => {
    const onClose = vi.fn();
    render(
      <Modal open onClose={onClose}>
        내용
      </Modal>,
    );

    const handled = closeTopSheet();

    expect(handled).toBe(true);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('dismissible=false면 네이티브 뒤로가기로 닫히지 않는다', () => {
    const onClose = vi.fn();
    render(
      <Modal open onClose={onClose} dismissible={false}>
        내용
      </Modal>,
    );

    const handled = closeTopSheet();

    expect(handled).toBe(false);
    expect(onClose).not.toHaveBeenCalled();
  });

  it('다이얼로그 role과 aria-modal을 갖는다', () => {
    render(
      <Modal open onClose={vi.fn()}>
        내용
      </Modal>,
    );

    expect(screen.getByRole('dialog')).toHaveAttribute('aria-modal', 'true');
  });

  it('열리면 포커스가 다이얼로그 패널로 이동한다', () => {
    render(
      <Modal open onClose={vi.fn()}>
        내용
      </Modal>,
    );

    expect(document.activeElement).toBe(screen.getByRole('dialog'));
  });

  it('닫히면 이전에 포커스했던 요소로 되돌아간다', () => {
    const outsideButton = document.createElement('button');
    document.body.appendChild(outsideButton);
    outsideButton.focus();

    const { rerender } = render(
      <Modal open onClose={vi.fn()}>
        내용
      </Modal>,
    );
    rerender(
      <Modal open={false} onClose={vi.fn()}>
        내용
      </Modal>,
    );

    expect(document.activeElement).toBe(outsideButton);
    outsideButton.remove();
  });

  it('열려있는 동안 Tab으로 마지막 요소 다음에서 처음 요소로 순환한다', () => {
    render(
      <Modal open onClose={vi.fn()}>
        <button>첫번째</button>
        <button>마지막</button>
      </Modal>,
    );
    screen.getByText('마지막').focus();

    fireEvent.keyDown(window, { key: 'Tab' });

    // 닫기 버튼이 패널의 첫 요소다
    expect(document.activeElement).toBe(screen.getByLabelText('닫기'));
  });

  it('열려있는 동안 Shift+Tab으로 첫 요소 이전에서 마지막 요소로 순환한다', () => {
    render(
      <Modal open onClose={vi.fn()}>
        <button>첫번째</button>
        <button>마지막</button>
      </Modal>,
    );
    screen.getByLabelText('닫기').focus();

    fireEvent.keyDown(window, { key: 'Tab', shiftKey: true });

    expect(document.activeElement).toBe(screen.getByText('마지막'));
  });

  it('막 열려 패널 자체에 포커스가 있을 때 Shift+Tab을 누르면 마지막 요소로 간다', () => {
    render(
      <Modal open onClose={vi.fn()}>
        <button>첫번째</button>
        <button>마지막</button>
      </Modal>,
    );

    fireEvent.keyDown(window, { key: 'Tab', shiftKey: true });

    expect(document.activeElement).toBe(screen.getByText('마지막'));
  });
});
