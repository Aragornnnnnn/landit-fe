// HapticMenuEntry — 토글이 저장값을 따르고, 누르면 설정을 바꾸며 계측을 남긴다
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { isHapticsEnabled, setHapticsEnabled } from '@/shared/haptics';

import { HapticMenuEntry } from './HapticMenuEntry';

const mocks = vi.hoisted(() => ({ track: vi.fn() }));
vi.mock('@/shared/analytics', () => ({ track: mocks.track }));

beforeEach(() => {
  localStorage.clear();
  mocks.track.mockClear();
});
afterEach(() => cleanup());

describe('HapticMenuEntry', () => {
  it('기본은 켬이고, 끄면 저장값과 계측에 남는다', () => {
    render(<HapticMenuEntry />);
    const toggle = screen.getByRole('switch', { name: '진동' });
    expect(toggle).toHaveAttribute('aria-checked', 'true');

    fireEvent.click(toggle);

    expect(toggle).toHaveAttribute('aria-checked', 'false');
    expect(isHapticsEnabled()).toBe(false);
    expect(mocks.track).toHaveBeenCalledWith('Haptics Toggled', {
      enabled: false,
    });
  });

  it('꺼 둔 기기에서는 꺼진 채로 열리고, 다시 켤 수 있다', () => {
    setHapticsEnabled(false);
    render(<HapticMenuEntry />);
    const toggle = screen.getByRole('switch', { name: '진동' });
    expect(toggle).toHaveAttribute('aria-checked', 'false');

    fireEvent.click(toggle);

    expect(isHapticsEnabled()).toBe(true);
  });
});
