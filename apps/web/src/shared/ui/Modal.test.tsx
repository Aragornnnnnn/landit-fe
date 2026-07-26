import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { closeTopSheet } from './bottom-sheet-back';
import { Modal } from './Modal';

// createPortal로 document.body에 그려지는 내용이라, 테스트 사이에 명시적으로 걷어낸다
afterEach(() => cleanup());

// 중첩된 framer-motion 인스턴스가 렌더러 아이덴티티를 갈라놔서, 테스트에선 순수 DOM으로 치환한다
vi.mock('motion/react', async () => {
  const { createElement, Fragment } = await import('react');
  const MOTION_PROPS = new Set([
    'initial',
    'animate',
    'exit',
    'transition',
    'whileTap',
    'whileHover',
    'whileInView',
    'layout',
    'variants',
  ]);
  const motion = new Proxy(
    {},
    {
      get:
        (_target, tag: string) =>
        ({ children, ...props }: Record<string, unknown>) =>
          createElement(
            tag,
            Object.fromEntries(
              Object.entries(props).filter(([key]) => !MOTION_PROPS.has(key)),
            ),
            children as React.ReactNode,
          ),
    },
  );
  return {
    motion,
    AnimatePresence: ({ children }: { children: React.ReactNode }) =>
      createElement(Fragment, null, children),
  };
});

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
});
