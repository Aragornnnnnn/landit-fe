// 셸 밖 이동 판별 — 웹 도메인 안은 WebView에 두고, 다른 도메인은 OS로 넘긴다
import { isExternalNavigation } from './isExternalNavigation';

const WEB_URL = 'https://app.landit.example';

describe('isExternalNavigation', () => {
  it('웹 도메인 안의 이동은 내부로 판별한다', () => {
    expect(isExternalNavigation(`${WEB_URL}/home`, WEB_URL)).toBe(false);
    expect(isExternalNavigation(`${WEB_URL}/download`, WEB_URL)).toBe(false);
  });

  it('다른 도메인의 이동은 외부로 판별한다', () => {
    expect(
      isExternalNavigation(
        'https://play.google.com/store/apps/details?id=com.saynow.app',
        WEB_URL,
      ),
    ).toBe(true);
  });

  it('도메인이 웹 도메인으로 시작하기만 하는 유사 도메인은 외부로 판별한다', () => {
    expect(
      isExternalNavigation('https://app.landit.example.evil.com/home', WEB_URL),
    ).toBe(true);
  });

  it('about:blank는 WebView가 로드 과정에서 거치므로 내부로 판별한다', () => {
    expect(isExternalNavigation('about:blank', WEB_URL)).toBe(false);
  });

  it('웹 URL이 없으면 전부 내부로 판별한다', () => {
    expect(isExternalNavigation('https://play.google.com', null)).toBe(false);
  });
});
