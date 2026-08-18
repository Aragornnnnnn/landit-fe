// usePartnerGreeting — 인사는 저절로 시작되지 않고 캐릭터를 눌러야 시작된다. 상대를 바꾸면 인사는 멈춘다
import { act, renderHook } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import * as aiSpeech from '@/features/conversation/model/useAiSpeech';

import { usePartnerGreeting } from './usePartnerGreeting';

vi.mock('@/features/conversation/model/useAiSpeech', () => ({
  useAiSpeech: vi.fn(() => ({
    speech: null,
    markDynamic: vi.fn(),
    prefetch: vi.fn(),
  })),
}));

const useAiSpeech = vi.mocked(aiSpeech.useAiSpeech);
const lastSpeechOptions = () => useAiSpeech.mock.calls.at(-1)![0];

describe('usePartnerGreeting', () => {
  it('들어오자마자 인사하지 않는다 — 기본 상대가 가만히 서 있다', () => {
    const { result } = renderHook(() => usePartnerGreeting());

    expect(result.current.partner.id).toBe('chloe');
    expect(result.current.look.posture).toBe('idle');
    expect(lastSpeechOptions().playing).toBe(false);
  });

  it('greet을 부르면 지금 상대의 자기소개가 재생되고 말하는 자세가 된다', () => {
    const { result } = renderHook(() => usePartnerGreeting());

    act(() => result.current.greet());

    expect(lastSpeechOptions().playing).toBe(true);
    expect(lastSpeechOptions().content).toBe(result.current.partner.intro);
    expect(result.current.look.posture).toBe('speaking');
    expect(result.current.look.expression).toBe('happy');
  });

  it('상대를 바꾸면 새 상대가 서기만 하고 인사는 하지 않는다', () => {
    const { result } = renderHook(() => usePartnerGreeting());

    act(() => result.current.selectPartner('marco'));

    expect(result.current.partner.id).toBe('marco');
    expect(lastSpeechOptions().playing).toBe(false);
  });

  it('인사하는 중에 상대를 바꾸면 하던 인사를 멈춘다', () => {
    const { result } = renderHook(() => usePartnerGreeting());

    act(() => result.current.greet());
    act(() => result.current.selectPartner('teddy'));

    expect(lastSpeechOptions().playing).toBe(false);
    expect(result.current.look.posture).toBe('idle');
  });

  it('인사가 끝나면 평소 자세로 돌아온다', () => {
    const { result } = renderHook(() => usePartnerGreeting());

    act(() => result.current.greet());
    act(() => lastSpeechOptions().onSpeechEnd());

    expect(lastSpeechOptions().playing).toBe(false);
    expect(result.current.look.posture).toBe('idle');
  });
});
