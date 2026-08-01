// 스토어 리다이렉트 라우트 — 기기(UA)별 스토어 갈림길과 앰플리튜드 서버 계측 검증
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

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
  it('iPhone에서 열면 App Store로 보낸다', async () => {
    const res = await GET(downloadRequest(IPHONE_UA));

    expect(res.status).toBe(307);
    expect(res.headers.get('location')).toBe(
      'https://apps.apple.com/kr/app/id6787414201',
    );
  });

  it('iPad에서 열면 App Store로 보낸다', async () => {
    const res = await GET(downloadRequest(IPAD_UA));

    expect(res.status).toBe(307);
    expect(res.headers.get('location')).toBe(
      'https://apps.apple.com/kr/app/id6787414201',
    );
  });

  it('인스타그램 인앱 브라우저(iOS)에서 열어도 App Store로 보낸다', async () => {
    const res = await GET(downloadRequest(INSTAGRAM_IOS_UA));

    expect(res.status).toBe(307);
    expect(res.headers.get('location')).toBe(
      'https://apps.apple.com/kr/app/id6787414201',
    );
  });

  it('Android에서 열면 Play 스토어로 보낸다', async () => {
    const res = await GET(downloadRequest(ANDROID_UA));

    expect(res.status).toBe(307);
    expect(res.headers.get('location')).toBe(
      'https://play.google.com/store/apps/details?id=com.saynow.app',
    );
  });

  it('데스크톱에서 열면 App Store로 보낸다', async () => {
    const res = await GET(downloadRequest(DESKTOP_UA));

    expect(res.status).toBe(307);
    expect(res.headers.get('location')).toBe(
      'https://apps.apple.com/kr/app/id6787414201',
    );
  });

  it('User-Agent가 없으면 App Store로 보낸다', async () => {
    const res = await GET(downloadRequest());

    expect(res.status).toBe(307);
    expect(res.headers.get('location')).toBe(
      'https://apps.apple.com/kr/app/id6787414201',
    );
  });
});

describe('GET /download 앰플리튜드 계측', () => {
  const fetchMock = vi.fn();

  beforeEach(() => {
    vi.stubEnv('AMPLITUDE_API_KEY', 'test-key');
    fetchMock.mockResolvedValue(new Response('ok'));
    vi.stubGlobal('fetch', fetchMock);
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
    fetchMock.mockReset();
  });

  const sentBody = () => {
    const [, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    return JSON.parse(init.body as string);
  };

  it('Android 진입을 store=play_store로 기록한다', async () => {
    await GET(downloadRequest(ANDROID_UA));

    expect(fetchMock).toHaveBeenCalledWith(
      'https://api2.amplitude.com/2/httpapi',
      expect.objectContaining({ method: 'POST' }),
    );
    const body = sentBody();
    expect(body.api_key).toBe('test-key');
    expect(body.events[0]).toMatchObject({
      event_type: 'Download Link Visited',
      event_properties: { store: 'play_store' },
    });
    expect(body.events[0].device_id).toBeTruthy();
  });

  it('iPhone 진입을 store=app_store로 기록한다', async () => {
    await GET(downloadRequest(IPHONE_UA));

    expect(sentBody().events[0]).toMatchObject({
      event_type: 'Download Link Visited',
      event_properties: { store: 'app_store' },
    });
  });

  it('API 키가 없으면 이벤트를 보내지 않고 리다이렉트만 한다', async () => {
    vi.stubEnv('AMPLITUDE_API_KEY', '');

    const res = await GET(downloadRequest(IPHONE_UA));

    expect(fetchMock).not.toHaveBeenCalled();
    expect(res.status).toBe(307);
  });

  it('이벤트 전송이 실패해도 리다이렉트는 그대로 된다', async () => {
    fetchMock.mockRejectedValue(new Error('network down'));

    const res = await GET(downloadRequest(ANDROID_UA));

    expect(res.status).toBe(307);
    expect(res.headers.get('location')).toBe(
      'https://play.google.com/store/apps/details?id=com.saynow.app',
    );
  });
});
