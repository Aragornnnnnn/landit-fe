// clearAccountLocalState — 계정 경험 기록만 지우고 로그인 정보·기기 설정은 남긴다
import { afterEach, describe, expect, it } from 'vitest';

import { clearAccountLocalState } from './account-local-state';

afterEach(() => localStorage.clear());

describe('clearAccountLocalState', () => {
  it('landit- 기록은 지우고, 로그인 정보·진동 설정·다른 앱 키는 남긴다', () => {
    localStorage.setItem('landit-lamp-summoned', '2026-09-11');
    localStorage.setItem('landit-onboarding-seen', '1');
    localStorage.setItem('landit-smalltalk-tap-greeting-seen', '1');
    localStorage.setItem('landit-auth', '{"state":{}}');
    localStorage.setItem('landit-haptics-off', '1');
    localStorage.setItem('other-app', 'x');

    clearAccountLocalState();

    expect(localStorage.getItem('landit-lamp-summoned')).toBeNull();
    expect(localStorage.getItem('landit-onboarding-seen')).toBeNull();
    expect(
      localStorage.getItem('landit-smalltalk-tap-greeting-seen'),
    ).toBeNull();
    expect(localStorage.getItem('landit-auth')).not.toBeNull();
    expect(localStorage.getItem('landit-haptics-off')).toBe('1');
    expect(localStorage.getItem('other-app')).toBe('x');
  });
});
