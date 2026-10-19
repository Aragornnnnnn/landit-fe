// 홈에서 투어가 무엇을 보여 줄지 — 이어하기 안내·챌린지 소개·카드·페이월
import { describe, expect, it } from 'vitest';

import { homeTourViewOf } from './home-tour-view';

describe('homeTourViewOf', () => {
  const base = {
    screen: 'challenge_intro' as const,
    live: true,
    cleared: true,
    showerHold: false,
  };

  it('투어가 없으면 아무것도 띄우지 않는다', () => {
    expect(homeTourViewOf({ ...base, screen: 'none' })).toBe('none');
  });

  it('이번 실행에서 투어를 이어 오지 않았으면(앱을 새로 열었으면) 이어하기 안내부터 띄운다', () => {
    expect(homeTourViewOf({ ...base, live: false })).toBe('resume');
  });

  it('챌린지 소개는 동전 연출이 끝난 뒤에 띄운다', () => {
    expect(homeTourViewOf({ ...base, showerHold: true })).toBe('none');
    expect(homeTourViewOf(base)).toBe('challenge_intro');
  });

  it('뒤집기 코치와 무료 표현은 카드에서 한다', () => {
    expect(homeTourViewOf({ ...base, screen: 'auto_flip' })).toBe('card');
    expect(homeTourViewOf({ ...base, screen: 'free_expression' })).toBe('card');
  });

  it('카드가 필요한 차례인데 오늘 카드를 아직 안 끝냈으면(날이 바뀜) 다음 대화까지 쉰다 — 이어하기 안내도 띄우지 않는다', () => {
    expect(
      homeTourViewOf({
        ...base,
        screen: 'auto_flip',
        cleared: false,
        live: false,
      }),
    ).toBe('none');
  });

  it('표현을 끝내고 페이월 전에 나갔으면 페이월로 보낸다', () => {
    expect(homeTourViewOf({ ...base, screen: 'paywall' })).toBe('paywall');
  });
});
