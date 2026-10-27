// 로그인 버튼에 무엇을 어떤 순서로 둘지 — 한국어는 카카오가 먼저, 일본어는 카카오를 지난번에 쓴 사람에게만 맨 아래에
import { describe, expect, it } from 'vitest';

import { loginProvidersOf } from './login-providers';

describe('loginProvidersOf', () => {
  it('한국어 화면은 카카오·구글·애플 순서다', () => {
    expect(
      loginProvidersOf({ locale: 'ko', android: false, lastProvider: null }),
    ).toEqual(['kakao', 'google', 'apple']);
  });

  it('안드로이드에는 애플이 없다', () => {
    expect(
      loginProvidersOf({ locale: 'ko', android: true, lastProvider: null }),
    ).toEqual(['kakao', 'google']);
  });

  it('일본어 화면은 카카오를 빼고 구글·애플만 둔다 — 일본에서는 카카오 계정이 거의 없다', () => {
    expect(
      loginProvidersOf({
        locale: 'ja',
        android: false,
        lastProvider: 'google',
      }),
    ).toEqual(['google', 'apple']);
  });

  it('일본어 화면이어도 이 기기에서 지난번에 카카오로 들어왔으면 맨 아래에 둔다 — 기존 카카오 가입자가 길을 잃지 않게', () => {
    expect(
      loginProvidersOf({ locale: 'ja', android: false, lastProvider: 'kakao' }),
    ).toEqual(['google', 'apple', 'kakao']);
  });
});
