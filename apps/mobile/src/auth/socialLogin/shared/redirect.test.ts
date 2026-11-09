// OAuth 콜백 딥링크 판별 검증 — 라우터가 콜백 링크로 화면 전환(Unmatched Route)하지 않게 하는 근거
import { redirectSystemPath } from '../../../app/+native-intent';
import { isKakaoTalkLoginUrl, isOAuthRedirectUrl } from './redirect';

describe('isOAuthRedirectUrl', () => {
  it('안드로이드 구글 콜백(패키지명 스킴, 슬래시 1개)을 콜백으로 판별한다', () => {
    expect(
      isOAuthRedirectUrl('com.saynow.app:/oauthredirect?state=abc&code=xyz'),
    ).toBe(true);
  });

  it('iOS 구글 콜백(reversed client ID 스킴)을 콜백으로 판별한다', () => {
    expect(
      isOAuthRedirectUrl(
        'com.googleusercontent.apps.1062331189445-abc:/oauthredirect?code=xyz',
      ),
    ).toBe(true);
  });

  it('구 바이너리의 landit 스킴 콜백(슬래시 2개)도 콜백으로 판별한다', () => {
    expect(isOAuthRedirectUrl('landit://oauthredirect?state=abc')).toBe(true);
  });

  it('쿼리 없는 콜백도 판별한다', () => {
    expect(isOAuthRedirectUrl('com.saynow.app:/oauthredirect')).toBe(true);
  });

  it('일반 딥링크는 콜백이 아니다', () => {
    expect(isOAuthRedirectUrl('landit://')).toBe(false);
    expect(isOAuthRedirectUrl('landit://home')).toBe(false);
    expect(isOAuthRedirectUrl('https://example.com/login')).toBe(false);
  });
});

describe('isKakaoTalkLoginUrl', () => {
  const KAKAO_SCHEME = 'kakao09462cccdbd1a0723c5f87929a94a528';

  it('카카오톡 앱 전환 로그인 복귀 주소를 판별한다', () => {
    expect(isKakaoTalkLoginUrl(`${KAKAO_SCHEME}://oauth?code=xyz`)).toBe(true);
  });

  it('로그인 실패로 돌아온 주소도 판별한다', () => {
    expect(
      isKakaoTalkLoginUrl(`${KAKAO_SCHEME}://oauth?error=access_denied`),
    ).toBe(true);
  });

  it('카카오 스킴이어도 oauth가 아니면 복귀 주소가 아니다', () => {
    expect(isKakaoTalkLoginUrl(`${KAKAO_SCHEME}://kakaolink?x=1`)).toBe(false);
  });

  it('카카오 스킴이 아니면 oauth여도 복귀 주소가 아니다', () => {
    expect(isKakaoTalkLoginUrl('landit://oauth?code=xyz')).toBe(false);
  });
});

describe('redirectSystemPath', () => {
  it('카카오톡 로그인 복귀 주소면 null을 돌려줘 라우터 전환을 막는다', () => {
    expect(
      redirectSystemPath({
        path: 'kakao09462cccdbd1a0723c5f87929a94a528://oauth?code=xyz',
        initial: false,
      }),
    ).toBeNull();
  });

  it('OAuth 콜백이면 null을 돌려줘 라우터 전환을 막는다', () => {
    expect(
      redirectSystemPath({
        path: 'com.saynow.app:/oauthredirect?code=xyz',
        initial: false,
      }),
    ).toBeNull();
  });

  it('OAuth 콜백이 아니면 경로를 그대로 돌려준다', () => {
    expect(redirectSystemPath({ path: 'landit://home', initial: true })).toBe(
      'landit://home',
    );
  });
});
