// 세션 정리 — 로그아웃·탈퇴·세션 만료 뒤 다음 사람이 이전 계정의 언어를 물려받지 않는지 검증한다
// @vitest-environment jsdom
import { describe, expect, it } from 'vitest';

import { clearSession } from './clear-session';

describe('clearSession', () => {
  it('언어 쿠키를 지워 로그인 화면이 다시 기기 언어로 그려지게 한다', () => {
    document.cookie = 'landit-locale=ja; path=/';

    clearSession();

    expect(document.cookie).not.toContain('landit-locale=');
  });
});
