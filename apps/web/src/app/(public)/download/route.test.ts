// 스토어 리다이렉트 라우트 — 기기(UA)별로 App Store·Play 스토어·랜딩 갈림길 검증
import { describe, expect, it } from 'vitest';

import { GET } from './route';

function downloadRequest(userAgent?: string): Request {
  return new Request('http://localhost/download', {
    headers: userAgent ? { 'user-agent': userAgent } : {},
  });
}

const IPHONE_UA =
  'Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1';
const IPAD_UA =
  'Mozilla/5.0 (iPad; CPU OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1';
const ANDROID_UA =
  'Mozilla/5.0 (Linux; Android 14; SM-S921N) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Mobile Safari/537.36';
const INSTAGRAM_IOS_UA =
  'Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 Instagram 334.0.0.0.0';
const DESKTOP_UA =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36';

describe('GET /download', () => {
  it('iPhone에서 열면 App Store로 보낸다', () => {
    const res = GET(downloadRequest(IPHONE_UA));

    expect(res.status).toBe(307);
    expect(res.headers.get('location')).toBe(
      'https://apps.apple.com/kr/app/id6787414201',
    );
  });

  it('iPad에서 열면 App Store로 보낸다', () => {
    const res = GET(downloadRequest(IPAD_UA));

    expect(res.headers.get('location')).toBe(
      'https://apps.apple.com/kr/app/id6787414201',
    );
  });

  it('인스타그램 인앱 브라우저(iOS)에서 열어도 App Store로 보낸다', () => {
    const res = GET(downloadRequest(INSTAGRAM_IOS_UA));

    expect(res.headers.get('location')).toBe(
      'https://apps.apple.com/kr/app/id6787414201',
    );
  });

  it('Android에서 열면 Play 스토어로 보낸다', () => {
    const res = GET(downloadRequest(ANDROID_UA));

    expect(res.status).toBe(307);
    expect(res.headers.get('location')).toBe(
      'https://play.google.com/store/apps/details?id=com.saynow.app',
    );
  });

  it('데스크톱에서 열면 App Store로 보낸다', () => {
    const res = GET(downloadRequest(DESKTOP_UA));

    expect(res.status).toBe(307);
    expect(res.headers.get('location')).toBe(
      'https://apps.apple.com/kr/app/id6787414201',
    );
  });

  it('User-Agent가 없으면 App Store로 보낸다', () => {
    const res = GET(downloadRequest());

    expect(res.headers.get('location')).toBe(
      'https://apps.apple.com/kr/app/id6787414201',
    );
  });
});
