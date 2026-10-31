// useIntroGuide — 처음 온 기기에 첫 안내를 한 번 띄우고, 캐릭터를 누르면 언제든 인사하며 들은 것으로 남기는지 검증
// @vitest-environment jsdom
import { act, renderHook } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { track } from '@/shared/analytics';

import { introGuideSeen } from '../../_model/intro-guide-seen';
import { tapGreetingSeen } from '../../_model/tap-greeting-seen';
import { useIntroGuide } from './useIntroGuide';

vi.mock('@/shared/analytics', () => ({ track: vi.fn() }));

const base = {
  onTap: vi.fn(),
  copy: {
    freeTalkBody: '세 친구와 <em>대화</em>해요',
    endingBody: '인사하면 끝나요',
  },
  free: true,
  premium: false,
  exhausted: false,
};

afterEach(() => localStorage.clear());

describe('useIntroGuide', () => {
  it('붙잡혀 있는 동안엔 안내를 띄우지 않는다', () => {
    const { result } = renderHook(() => useIntroGuide({ ...base, held: true }));

    expect(result.current.guideOpen).toBe(false);
  });

  it('붙잡힘이 풀리면 처음 온 기기에 안내를 띄운다', () => {
    const { result, rerender } = renderHook(
      ({ held }) => useIntroGuide({ ...base, held }),
      { initialProps: { held: true } },
    );

    rerender({ held: false });

    expect(result.current.guideOpen).toBe(true);
  });

  it('안내를 닫으면 본 것으로 남기고 다시 띄우지 않는다', () => {
    const { result } = renderHook(() => useIntroGuide(base));

    act(() => result.current.close());

    expect(result.current.guideOpen).toBe(false);
    expect(introGuideSeen.has()).toBe(true);
    expect(track).toHaveBeenCalledWith('Small Talk Intro Guide Closed');
  });

  it('안내를 닫으면 바뀌기 전 안내들을 본 기록을 지운다', () => {
    localStorage.setItem('landit-smalltalk-intro-guide-seen', '1');
    localStorage.setItem('landit-smalltalk-intro-guide-seen-v2', '1');
    const { result } = renderHook(() => useIntroGuide(base));

    act(() => result.current.close());

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
    const { result } = renderHook(() => useIntroGuide(base));

    // Then 무료 5분을 말하는 새 안내가 뜬다
    expect(result.current.guideOpen).toBe(true);
  });

  it('안내를 본 기기는 들어와도 안내가 없다', () => {
    introGuideSeen.mark();

    const { result } = renderHook(() => useIntroGuide(base));

    expect(result.current.guideOpen).toBe(false);
  });

  it('캐릭터를 누르면 언제든 인사하고 들은 것으로 남긴다 — 탭 칩의 점이 사라진다', () => {
    // Given 안내를 본 기기에서
    introGuideSeen.mark();
    const onTap = vi.fn();
    const { result } = renderHook(() => useIntroGuide({ ...base, onTap }));

    // When 캐릭터를 누르면
    act(() => result.current.tapPartner());

    // Then 인사가 시작되고 들은 것으로 남는다
    expect(onTap).toHaveBeenCalledOnce();
    expect(tapGreetingSeen.has()).toBe(true);
  });

  it('안내를 본 뒤에야 본 것으로 답한다 — 캐릭터 옆 힌트가 안내보다 먼저 번쩍이지 않게', () => {
    const { result } = renderHook(() => useIntroGuide({ ...base, held: true }));
    expect(result.current.guideSeen).toBe(false);

    act(() => result.current.close());

    expect(result.current.guideSeen).toBe(true);
  });

  it('비출 자리는 안내가 뜨는 순간 고정한다 — 도중에 무료 여부가 바뀌어도 그대로다', () => {
    // Given 무료 사용자에게 안내가 떴을 때
    const { result, rerender } = renderHook(
      ({ free }) => useIntroGuide({ ...base, free }),
      { initialProps: { free: true } },
    );
    expect(result.current.spotlights).toEqual(['limit']);

    // When 도중에 구독이 와서 무료가 아니게 되면
    rerender({ free: false });

    // Then 비추던 자리는 그대로다
    expect(result.current.spotlights).toEqual(['limit']);
  });

  it('다음으로 넘기면 첫 자리를 비추고, 마지막 자리에서 한 번 더 넘기면 닫힌다', () => {
    const { result } = renderHook(() => useIntroGuide(base));
    expect(result.current.spotlight).toBeNull();

    act(() => result.current.next());
    expect(result.current.spotlight).toBe('limit');

    act(() => result.current.next());
    expect(result.current.guideOpen).toBe(false);
    expect(introGuideSeen.has()).toBe(true);
  });

  it('비출 자리가 없으면 넘기는 순간 닫힌다 — 래디의 말만 하고 끝', () => {
    const { result } = renderHook(() =>
      useIntroGuide({ ...base, free: false }),
    );

    act(() => result.current.next());

    expect(result.current.guideOpen).toBe(false);
  });

  it('예전 안내를 본 구독자에겐 새 안내를 띄우지 않고 본 것으로 남긴다', () => {
    // Given 예전 안내를 본 구독자
    vi.mocked(track).mockClear();
    localStorage.setItem('landit-smalltalk-intro-guide-seen-v2', '1');

    // When 스몰톡 탭에 들어오면
    const { result } = renderHook(() =>
      useIntroGuide({ ...base, free: false, premium: true }),
    );

    // Then 안내 없이 본 것으로 치고, 닫은 것으로 세지는 않는다
    expect(result.current.guideOpen).toBe(false);
    expect(result.current.guideSeen).toBe(true);
    expect(introGuideSeen.has()).toBe(true);
    expect(track).not.toHaveBeenCalled();
  });

  it('예전 안내를 본 무료 사용자에겐 새 안내를 띄운다', () => {
    // Given 예전 안내를 본 무료 사용자
    localStorage.setItem('landit-smalltalk-intro-guide-seen-v2', '1');

    // When 스몰톡 탭에 들어오면
    const { result } = renderHook(() => useIntroGuide(base));

    // Then 무료 5분을 알리는 새 안내가 뜬다
    expect(result.current.guideOpen).toBe(true);
  });

  it('처음 온 구독자에겐 안내를 띄운다 — 건너뛰는 건 예전 안내를 본 사람뿐이다', () => {
    // Given 아무 안내도 본 적 없는 구독자
    // When 스몰톡 탭에 들어오면
    const { result } = renderHook(() =>
      useIntroGuide({ ...base, free: false, premium: true }),
    );

    // Then 안내가 뜬다
    expect(result.current.guideOpen).toBe(true);
  });
});
