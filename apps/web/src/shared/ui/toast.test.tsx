// 전역 토스트 — 키보드가 올라와 있으면 가리지 않게 키보드 위로 올라가는지 검증한다
import { act, cleanup, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { showToast, TOAST_MS, Toaster } from './toast';

// visualViewport 대역 — 높이를 줄이면 그만큼 키보드가 가린 것으로 본다
const viewport = Object.assign(new EventTarget(), {
  height: 874,
  offsetTop: 0,
});

beforeEach(() => {
  viewport.height = 874;
  Object.defineProperty(window, 'innerHeight', {
    configurable: true,
    value: 874,
  });
  Object.defineProperty(window, 'visualViewport', {
    configurable: true,
    value: viewport,
  });
});

afterEach(() => {
  cleanup();
  vi.useRealTimers();
});

// 토스트 글자를 감싼 고정 위치 틀
const toastFrame = () =>
  screen.getByText('안내').closest('.fixed') as HTMLElement;

describe('Toaster', () => {
  it('키보드가 올라와 있으면 키보드 위에 띄운다', () => {
    viewport.height = 538;
    render(<Toaster />);

    act(() => showToast('안내'));

    expect(toastFrame().style.bottom).toBe('352px');
  });

  it('같은 안내를 떠 있는 동안 다시 띄우면 새로 그리지 않고 그대로 둔다', () => {
    // 새로 그리면 사라졌다 나타나며 번쩍인다
    render(<Toaster />);
    act(() => showToast('안내'));
    const first = screen.getByText('안내');

    act(() => showToast('안내'));

    expect(screen.getAllByText('안내')).toEqual([first]);
  });

  it('같은 안내를 다시 띄우면 그때부터 다시 떠 있는 시간을 센다', () => {
    vi.useFakeTimers();
    render(<Toaster />);
    act(() => showToast('안내'));
    act(() => vi.advanceTimersByTime(TOAST_MS - 500));

    act(() => showToast('안내'));
    act(() => vi.advanceTimersByTime(TOAST_MS - 500));

    expect(screen.getByText('안내')).toBeInTheDocument();
  });

  it('키보드가 없으면 원래 자리(화면 아래)에 띄운다', () => {
    render(<Toaster />);

    act(() => showToast('안내'));

    expect(toastFrame().style.bottom).toBe('');
  });
});
