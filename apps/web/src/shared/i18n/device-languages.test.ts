// 기기 선호 언어 목록 — 셸이 넘긴 목록을 먼저 쓰고, 없으면(브라우저·구 셸) navigator.languages로 떨어지는지 검증한다
// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';

import { deviceLanguages } from './device-languages';

const shell = {
  platform: 'ios',
  appVersion: '1.6.0',
  buildNumber: '30',
  bridgeVersion: 14,
} as const;

afterEach(() => {
  delete window.__LANDIT_NATIVE__;
  vi.restoreAllMocks();
});

describe('deviceLanguages', () => {
  it('셸이 기기 언어 목록을 넘겼으면 그 목록을 쓴다 — iOS WebView의 navigator.languages는 첫 언어만 줄 수 있다', () => {
    vi.spyOn(navigator, 'languages', 'get').mockReturnValue(['en-US']);
    window.__LANDIT_NATIVE__ = { ...shell, languages: ['en-US', 'ja-JP'] };

    expect(deviceLanguages()).toEqual(['en-US', 'ja-JP']);
  });

  it('셸 목록이 없으면(브라우저·구 셸) navigator.languages를 쓴다', () => {
    vi.spyOn(navigator, 'languages', 'get').mockReturnValue(['ko-KR', 'en']);
    window.__LANDIT_NATIVE__ = shell;

    expect(deviceLanguages()).toEqual(['ko-KR', 'en']);
  });

  it('셸이 빈 목록을 넘기면 navigator.languages로 떨어진다', () => {
    vi.spyOn(navigator, 'languages', 'get').mockReturnValue(['ja']);
    window.__LANDIT_NATIVE__ = { ...shell, languages: [] };

    expect(deviceLanguages()).toEqual(['ja']);
  });
});
