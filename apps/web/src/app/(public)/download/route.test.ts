// 스토어 리다이렉트 라우트 — 기기(UA)별 스토어 갈림길과 앰플리튜드 서버 계측 검증
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { GET } from './route';

function downloadRequest(userAgent?: string, query = ''): Request {
  return new Request(`http://localhost/download${query}`, {
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

const KAKAO_SCRAP_UA = 'kakaotalk-scrap/1.0; +https://devtalk.kakao.com/';
// iMessage 링크 미리보기가 보내는 UA
const IMESSAGE_PREVIEW_UA =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_11_1) AppleWebKit/601.2.4 (KHTML, like Gecko) Version/9.0.1 Safari/601.2.4 facebookexternalhit/1.1 Facebot Twitterbot/1.0';

describe('GET /download 링크 미리보기', () => {
  beforeEach(() => {
    vi.stubEnv('NEXT_PUBLIC_AMPLITUDE_API_KEY', '');
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it.each([
    ['카카오톡', KAKAO_SCRAP_UA],
    ['iMessage', IMESSAGE_PREVIEW_UA],
  ])(
    '%s 미리보기 봇이면 스토어로 보내지 않고 랜딧 미리보기를 준다',
    async (_, userAgent) => {
      const res = await GET(downloadRequest(userAgent));
      const html = await res.text();

      expect(res.status).toBe(200);
      expect(res.headers.get('content-type')).toContain('text/html');
      expect(html).toContain(
        '<meta property="og:title" content="랜딧(Landit): 영어회화·스픽·스피킹·표현·리스닝 앱"',
      );
      expect(html).toContain(
        '<meta property="og:image" content="http://localhost/og/share.jpg"',
      );
    },
  );

  it.each([
    ['카카오톡', `${IPHONE_UA} KAKAOTALK 10.8.0`],
    ['라인', `${IPHONE_UA} Safari Line/13.20.0`],
  ])(
    '%s 인앱 브라우저로 연 사람은 봇이 아니라 스토어로 보낸다',
    async (_, userAgent) => {
      const res = await GET(downloadRequest(userAgent));

      expect(res.status).toBe(307);
    },
  );
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

  it('링크에 붙은 UTM 딱지를 함께 기록한다', async () => {
    await GET(
      downloadRequest(
        ANDROID_UA,
        '?utm_source=share&utm_medium=referral&utm_campaign=friend_invite',
      ),
    );

    expect(sentBody().events[0].event_properties).toEqual({
      store: 'play_store',
      utm_source: 'share',
      utm_medium: 'referral',
      utm_campaign: 'friend_invite',
    });
  });

  it.each([
    ['없으면', ''],
    ['비어 있으면', '?utm_source=&utm_campaign='],
  ])('UTM 딱지가 %s store만 기록한다', async (_, query) => {
    await GET(downloadRequest(IPHONE_UA, query));

    expect(sentBody().events[0].event_properties).toEqual({
      store: 'app_store',
    });
  });

  it('미리보기 봇의 방문은 기록하지 않는다', async () => {
    await GET(downloadRequest(KAKAO_SCRAP_UA));

    expect(fetchMock).not.toHaveBeenCalled();
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
