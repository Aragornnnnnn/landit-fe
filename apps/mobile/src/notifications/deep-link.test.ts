// 알림 페이로드 경로 추출 검증 — 내부 절대 경로만 통과시키는 계약 (발송자 입력 불신)
import { extractNotificationPath } from './deep-link';

describe('extractNotificationPath', () => {
  it('data.url의 내부 절대 경로를 돌려준다', () => {
    expect(extractNotificationPath({ url: '/expressions' })).toBe(
      '/expressions',
    );
    expect(extractNotificationPath({ url: '/expressions?from=push' })).toBe(
      '/expressions?from=push',
    );
  });

  it('오리진 밖으로 이탈 가능한 주소는 버린다', () => {
    expect(extractNotificationPath({ url: 'https://evil.com' })).toBeNull();
    expect(extractNotificationPath({ url: '//evil.com' })).toBeNull();
    // 브라우저가 \를 /로 정규화해 '//evil.com'이 된다
    expect(extractNotificationPath({ url: '/\\evil.com' })).toBeNull();
    expect(extractNotificationPath({ url: 'expressions' })).toBeNull();
  });

  it('페이로드 형태가 어긋나면 null을 돌려준다', () => {
    expect(extractNotificationPath({})).toBeNull();
    expect(extractNotificationPath({ url: 1 })).toBeNull();
    expect(extractNotificationPath(null)).toBeNull();
    expect(extractNotificationPath(undefined)).toBeNull();
    expect(extractNotificationPath('/expressions')).toBeNull();
  });
});
