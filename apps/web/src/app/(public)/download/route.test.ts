// 스토어 리다이렉트 라우트 — 기기(UA)별 스토어 갈림길과 앰플리튜드 서버 계측 검증
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { GET } from './route';

function downloadRequest(
  userAgent?: string,
  url = 'http://localhost/download',
): Request {
  return new Request(url, {
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
  // 키를 비워 계측을 끈다 — 리다이렉트 테스트가 실제 앰플리튜드로 요청을 보내지 않게
  beforeEach(() => {
    vi.stubEnv('NEXT_PUBLIC_AMPLITUDE_API_KEY', '');
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

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
    vi.stubEnv('NEXT_PUBLIC_AMPLITUDE_API_KEY', 'test-key');
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
      event_properties: { store: 'play_store', source: 'link' },
    });
    expect(body.events[0].device_id).toBeTruthy();
  });

  it('iPhone 진입을 store=app_store로 기록한다', async () => {
    await GET(downloadRequest(IPHONE_UA));

    expect(sentBody().events[0]).toMatchObject({
      event_type: 'Download Link Visited',
      event_properties: { store: 'app_store', source: 'link' },
    });
  });

  it('?source=app_update로 오면 source=app_update로 기록한다', async () => {
    await GET(
      downloadRequest(IPHONE_UA, 'http://localhost/download?source=app_update'),
    );

    expect(sentBody().events[0].event_properties).toMatchObject({
      source: 'app_update',
    });
  });

  it('모르는 source 값은 link로 기록한다', async () => {
    await GET(
      downloadRequest(IPHONE_UA, 'http://localhost/download?source=hacked'),
    );

    expect(sentBody().events[0].event_properties).toMatchObject({
      source: 'link',
    });
  });

  it('API 키가 없으면 이벤트를 보내지 않고 리다이렉트만 한다', async () => {
    vi.stubEnv('NEXT_PUBLIC_AMPLITUDE_API_KEY', '');

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

  it('응답이 오지 않으면 타임아웃으로 끊고 리다이렉트한다', async () => {
    // abort 전까지 영원히 pending인 fetch — 타임아웃 시그널이 끊어줘야 통과한다
    fetchMock.mockImplementation(
      (_url: unknown, init: RequestInit) =>
        new Promise((_resolve, reject) => {
          init.signal?.addEventListener('abort', () =>
            reject(init.signal?.reason),
          );
        }),
    );

    const res = await GET(downloadRequest(ANDROID_UA));

    expect(res.status).toBe(307);
  });
});
