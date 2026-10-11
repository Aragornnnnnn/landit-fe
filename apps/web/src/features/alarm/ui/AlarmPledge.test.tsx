// AlarmPledge — 손가락은 3초 눌러 다짐하고, 키보드·보조기기는 버튼을 누르는 것만으로 다짐한다
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { AlarmPledge } from './AlarmPledge';

vi.mock('@/shared/haptics', () => ({ haptic: vi.fn() }));
// 휠은 라이브러리 DOM에 기대 jsdom에서 돌지 않는다 — 다짐 버튼만 본다
vi.mock('./TimeWheel', () => ({ TimeWheel: () => null }));

const SEVEN_PM = { hour: 19, minute: 0 };

afterEach(() => {
  cleanup();
  vi.useRealTimers();
});

describe('AlarmPledge', () => {
  it('키보드나 스크린 리더로 버튼을 누르면 바로 다짐한다', () => {
    // given
    const onPledge = vi.fn();
    render(<AlarmPledge initialTime={SEVEN_PM} onPledge={onPledge} />);

    // when — 보조기기가 보낸 클릭은 detail이 0이다
    fireEvent.click(
      screen.getByRole('button', { name: '3초간 눌러 다짐하기' }),
      {
        detail: 0,
      },
    );

    // then
    expect(onPledge).toHaveBeenCalledWith(SEVEN_PM);
  });

  it('손가락으로 짧게 탭하면 다짐하지 않는다', () => {
    // given
    vi.useFakeTimers();
    const onPledge = vi.fn();
    render(<AlarmPledge initialTime={SEVEN_PM} onPledge={onPledge} />);
    const button = screen.getByRole('button', { name: '3초간 눌러 다짐하기' });

    // when
    fireEvent.pointerDown(button);
    fireEvent.pointerUp(button);
    fireEvent.click(button, { detail: 1 });
    vi.advanceTimersByTime(3000);

    // then
    expect(onPledge).not.toHaveBeenCalled();
  });
});
