// SpeechRateMenuEntry — "음성" 행을 눌러 연 시트가 저장된 배속을 따르고, 고르면 바로 저장하며 계측을 남긴다
import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
} from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { getSpeechRate, setSpeechRate } from '@/shared/lib/speech-rate';

import { SpeechRateMenuEntry } from './SpeechRateMenuEntry';

// 경계 목 — 브라우저 오디오만 가짜로 둔다
class FakeAudio {
  static instances: FakeAudio[] = [];
  playbackRate = 1;
  onended: (() => void) | null = null;
  onerror: (() => void) | null = null;
  play = vi.fn(() => Promise.resolve());
  pause = vi.fn();

  constructor(public src: string) {
    FakeAudio.instances.push(this);
  }
}

const mocks = vi.hoisted(() => ({ track: vi.fn() }));
vi.mock('@/shared/analytics', () => ({ track: mocks.track }));
// motion 애니메이션(BottomSheet)을 순수 DOM으로 치환 — 렌더러 아이덴티티 문제 회피
vi.mock('motion/react', () => import('@/shared/motion/test-double'));

const openSheet = () =>
  fireEvent.click(screen.getByRole('button', { name: '음성' }));

beforeEach(() => {
  localStorage.clear();
  mocks.track.mockClear();
  FakeAudio.instances = [];
  vi.stubGlobal('Audio', FakeAudio);
});
afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

describe('SpeechRateMenuEntry', () => {
  it('아무것도 고른 적 없으면 1배가 골라진 채로 열린다', () => {
    render(<SpeechRateMenuEntry />);

    openSheet();

    expect(screen.getByRole('radio', { name: '1배' })).toHaveAttribute(
      'aria-checked',
      'true',
    );
  });

  it('배속을 고르면 바로 저장되고 계측에 남는다 — 확인 버튼 없이 즉시 적용이다', () => {
    render(<SpeechRateMenuEntry />);
    openSheet();

    fireEvent.click(screen.getByRole('radio', { name: '0.75배' }));

    expect(getSpeechRate()).toBe(0.75);
    expect(screen.getByRole('radio', { name: '0.75배' })).toHaveAttribute(
      'aria-checked',
      'true',
    );
    expect(mocks.track).toHaveBeenCalledWith('Speech Rate Changed', {
      rate: 0.75,
    });
  });

  it('이미 고른 기기에서는 그 배속이 골라진 채로 열린다', () => {
    setSpeechRate(1.5);
    render(<SpeechRateMenuEntry />);

    openSheet();

    expect(screen.getByRole('radio', { name: '1.5배' })).toHaveAttribute(
      'aria-checked',
      'true',
    );
    expect(screen.getByRole('radio', { name: '1배' })).toHaveAttribute(
      'aria-checked',
      'false',
    );
  });

  it('들어보기를 누르면 고른 배속으로 예문을 재생한다', () => {
    render(<SpeechRateMenuEntry />);
    openSheet();
    fireEvent.click(screen.getByRole('radio', { name: '1.5배' }));

    fireEvent.click(screen.getByRole('button', { name: '들어보기' }));

    expect(FakeAudio.instances).toHaveLength(1);
    expect(FakeAudio.instances[0]!.playbackRate).toBe(1.5);
    expect(FakeAudio.instances[0]!.play).toHaveBeenCalled();
  });

  it('배속을 고르자마자 들어보기를 눌러도 방금 고른 배속으로 재생한다', () => {
    render(<SpeechRateMenuEntry />);
    openSheet();

    // 고르기와 누르기 사이에 렌더가 끼지 않아도 최신 값이어야 한다 — 한 act 안에서 연달아 누른다
    act(() => {
      screen.getByRole('radio', { name: '1.25배' }).click();
      screen.getByRole('button', { name: '들어보기' }).click();
    });

    expect(FakeAudio.instances[0]!.playbackRate).toBe(1.25);
  });

  it('듣는 중에 배속을 바꾸면 멈추지 않고 그 소리부터 바로 바뀐다', () => {
    render(<SpeechRateMenuEntry />);
    openSheet();
    fireEvent.click(screen.getByRole('button', { name: '들어보기' }));

    fireEvent.click(screen.getByRole('radio', { name: '0.75배' }));

    expect(FakeAudio.instances).toHaveLength(1);
    expect(FakeAudio.instances[0]!.playbackRate).toBe(0.75);
    expect(FakeAudio.instances[0]!.pause).not.toHaveBeenCalled();
  });

  it('시트를 닫으면 재생을 멈춘다 — 화면을 나갔는데 소리가 남으면 안 된다', () => {
    render(<SpeechRateMenuEntry />);
    openSheet();
    fireEvent.click(screen.getByRole('button', { name: '들어보기' }));

    fireEvent.click(screen.getByRole('button', { name: '닫기' }));

    expect(FakeAudio.instances[0]!.pause).toHaveBeenCalled();
  });
});
