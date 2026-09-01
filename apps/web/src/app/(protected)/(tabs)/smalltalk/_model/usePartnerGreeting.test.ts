// usePartnerGreeting — 인사는 저절로 시작되지 않고 캐릭터를 눌러야 시작된다. 상대를 바꾸면 인사는 멈춘다.
// TTS는 경계라 목으로 둔다 — 미리 만든 음원(speakSrc) 재생과 그 종료만 흉내 낸다
import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { PARTNERS } from '@/features/small-talk/model/partner';
import { track } from '@/shared/analytics';

import { usePartnerGreeting } from './usePartnerGreeting';

vi.mock('@/shared/analytics', () => ({ track: vi.fn() }));

const ttsMock = vi.hoisted(() => ({
  state: { onEnd: undefined as (() => void) | undefined },
  speakSrc: vi.fn((_src: string, opts?: { onEnd?: () => void }) => {
    ttsMock.state.onEnd = opts?.onEnd;
  }),
  speak: vi.fn(() => Promise.resolve()),
  prefetch: vi.fn(() => Promise.resolve()),
  stop: vi.fn(),
}));
vi.mock('@/shared/tts/useTts', () => ({
  useTts: () => ({
    speak: ttsMock.speak,
    speakSrc: ttsMock.speakSrc,
    prefetch: ttsMock.prefetch,
    stop: ttsMock.stop,
    status: 'idle',
  }),
}));

const chloe = PARTNERS[0];
const teddy = PARTNERS[2];

beforeEach(() => vi.clearAllMocks());

describe('usePartnerGreeting', async () => {
  it('들어오면 기본 상대가 소리 없이 가만히 서 있다', async () => {
    const { result } = renderHook(() => usePartnerGreeting());

    expect(result.current.partner.id).toBe(chloe.id);
    expect(result.current.look.posture).toBe('idle');
    expect(ttsMock.speakSrc).not.toHaveBeenCalled();
  });

  it('캐릭터를 누르면 그 상대의 자기소개 음원이 재생되고 웃으며 말하는 자세가 된다', async () => {
    const { result } = renderHook(() => usePartnerGreeting());

    act(() => result.current.greet());

    expect(ttsMock.speakSrc).toHaveBeenCalledWith(
      chloe.introAudioSrc,
      expect.anything(),
    );
    expect(result.current.look).toEqual({
      posture: 'speaking',
      expression: 'happy',
    });
  });

  it('인사가 끝나면 평소 자세로 돌아온다', async () => {
    const { result } = renderHook(() => usePartnerGreeting());
    act(() => result.current.greet());

    await act(async () => ttsMock.state.onEnd?.());

    expect(result.current.look.posture).toBe('idle');
  });

  it('상대를 바꾸면 새 상대가 서기만 하고 인사는 하지 않는다', async () => {
    const { result } = renderHook(() => usePartnerGreeting());

    act(() => result.current.selectPartner(teddy.id));

    expect(result.current.partner.id).toBe(teddy.id);
    expect(ttsMock.speakSrc).not.toHaveBeenCalled();
  });

  it('상대를 바꾸면 선택 이벤트를 찍고, 같은 상대를 다시 누르면 찍지 않는다', async () => {
    const { result } = renderHook(() => usePartnerGreeting());

    act(() => result.current.selectPartner(teddy.id));
    act(() => result.current.selectPartner(teddy.id));

    expect(track).toHaveBeenCalledTimes(1);
    expect(track).toHaveBeenCalledWith('Small Talk Partner Selected', {
      partner: teddy.id,
    });
  });

  it('인사하는 중에 상대를 바꾸면 하던 인사를 멈추고 새 상대는 말하지 않는다', async () => {
    const { result } = renderHook(() => usePartnerGreeting());
    act(() => result.current.greet());

    act(() => result.current.selectPartner(teddy.id));

    expect(ttsMock.stop).toHaveBeenCalled();
    expect(ttsMock.speakSrc).toHaveBeenCalledTimes(1);
    expect(result.current.look.posture).toBe('idle');
  });
});
