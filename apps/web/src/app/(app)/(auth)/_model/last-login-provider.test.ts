// 마지막으로 로그인한 방법을 기기에 남기고 다시 읽는 규칙을 검증한다
// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';

import {
  readLastLoginProvider,
  rememberLoginProvider,
} from './last-login-provider';

afterEach(() => {
  localStorage.clear();
  vi.restoreAllMocks();
});

describe('last-login-provider', () => {
  it('로그인한 방법을 남기면 다음에 그 방법을 돌려준다', () => {
    // when
    rememberLoginProvider('google');

    // then
    expect(readLastLoginProvider()).toBe('google');
  });

  it('남긴 적이 없으면 null을 돌려준다', () => {
    expect(readLastLoginProvider()).toBeNull();
  });

  it('다른 방법으로 다시 로그인하면 마지막 방법으로 바뀐다', () => {
    // given
    rememberLoginProvider('kakao');

    // when
    rememberLoginProvider('apple');

    // then
    expect(readLastLoginProvider()).toBe('apple');
  });

  it('알 수 없는 값이 들어 있으면 null을 돌려준다', () => {
    // given — 다른 버전이 남겼거나 손상된 값
    localStorage.setItem('landit-last-login-provider', 'naver');

    // then
    expect(readLastLoginProvider()).toBeNull();
  });

  it('저장소를 못 쓰는 환경에서도 터지지 않고 null을 돌려준다', () => {
    // given — 사파리 비공개 모드처럼 접근 자체가 막힌 저장소
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('blocked');
    });
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('blocked');
    });

    // then
    expect(() => rememberLoginProvider('kakao')).not.toThrow();
    expect(readLastLoginProvider()).toBeNull();
  });
});
