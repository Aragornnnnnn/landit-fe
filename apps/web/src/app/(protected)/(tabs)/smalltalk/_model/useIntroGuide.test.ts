// useIntroGuide — 처음 온 기기에 첫 안내를 한 번 띄우고, 캐릭터를 누르면 언제든 인사하며 들은 것으로 남기는지 검증
// @vitest-environment jsdom
import { act, renderHook } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { track } from '@/shared/analytics';

import { tapGreetingSeen } from '../../_model/tap-greeting-seen';
import { introGuideSeen } from './intro-guide-seen';
import { useIntroGuide } from './useIntroGuide';

vi.mock('@/shared/analytics', () => ({ track: vi.fn() }));

afterEach(() => localStorage.clear());

describe('useIntroGuide', () => {
  it('붙잡혀 있는 동안엔 안내를 띄우지 않는다', () => {
    const { result } = renderHook(() =>
      useIntroGuide({ onTap: vi.fn(), held: true }),
    );

    expect(result.current.guideOpen).toBe(false);
  });

  it('붙잡힘이 풀리면 처음 온 기기에 안내를 띄운다', () => {
    const { result, rerender } = renderHook(
      ({ held }) => useIntroGuide({ onTap: vi.fn(), held }),
      { initialProps: { held: true } },
    );

    rerender({ held: false });

    expect(result.current.guideOpen).toBe(true);
  });

  it('안내를 닫으면 본 것으로 남기고 다시 띄우지 않는다', () => {
    const { result } = renderHook(() => useIntroGuide({ onTap: vi.fn() }));

    act(() => result.current.closeGuide());

    expect(result.current.guideOpen).toBe(false);
    expect(introGuideSeen.has()).toBe(true);
    expect(track).toHaveBeenCalledWith('Small Talk Intro Guide Closed');
  });

  it('안내를 닫으면 바뀌기 전 안내들을 본 기록을 지운다', () => {
    localStorage.setItem('landit-smalltalk-intro-guide-seen', '1');
    localStorage.setItem('landit-smalltalk-intro-guide-seen-v2', '1');
    const { result } = renderHook(() => useIntroGuide({ onTap: vi.fn() }));

    act(() => result.current.closeGuide());

    expect(
      localStorage.getItem('landit-smalltalk-intro-guide-seen'),
    ).toBeNull();
    expect(
      localStorage.getItem('landit-smalltalk-intro-guide-seen-v2'),
    ).toBeNull();
  });

  it('예전 안내만 본 기기는 새 안내를 다시 본다', () => {
    // Given 바뀌기 전 안내(v2)를 본 기존 사용자
    localStorage.setItem('landit-smalltalk-intro-guide-seen-v2', '1');

    // When 스몰톡에 들어오면
    const { result } = renderHook(() => useIntroGuide({ onTap: vi.fn() }));

    // Then 무료 5분을 말하는 새 안내가 뜬다
    expect(result.current.guideOpen).toBe(true);
  });

  it('안내를 본 기기는 들어와도 안내가 없다', () => {
    introGuideSeen.mark();

    const { result } = renderHook(() => useIntroGuide({ onTap: vi.fn() }));

    expect(result.current.guideOpen).toBe(false);
  });

  it('캐릭터를 누르면 언제든 인사하고 들은 것으로 남긴다 — 탭 칩의 점이 사라진다', () => {
    // Given 안내를 본 기기에서
    introGuideSeen.mark();
    const onTap = vi.fn();
    const { result } = renderHook(() => useIntroGuide({ onTap }));

    // When 캐릭터를 누르면
    act(() => result.current.tapPartner());

    // Then 인사가 시작되고 들은 것으로 남는다
    expect(onTap).toHaveBeenCalledOnce();
    expect(tapGreetingSeen.has()).toBe(true);
  });
});
