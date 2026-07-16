// 앰플리튜드 래퍼 계약 — 키 유무에 따른 no-op 전환, 공통 속성 병합, 유저 식별을 검증한다
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const amplitudeMock = vi.hoisted(() => {
  const identifySetCalls: Array<[string, unknown]> = [];
  return {
    identifySetCalls,
    initAll: vi.fn(),
    track: vi.fn(),
    identify: vi.fn(),
    setUserId: vi.fn(),
    reset: vi.fn(),
    Identify: class {
      set(key: string, value: unknown) {
        identifySetCalls.push([key, value]);
        return this;
      }
    },
  };
});

vi.mock('@amplitude/unified', () => amplitudeMock);

const nativeContextMock = vi.hoisted(() => ({
  context: null as {
    platform: string;
    appVersion: string;
    buildNumber: string | null;
    bridgeVersion: number;
  } | null,
}));

vi.mock('@/shared/bridge/native-context', () => ({
  getNativeContext: () => nativeContextMock.context,
  getSurface: () => (nativeContextMock.context ? 'app' : 'browser'),
}));

const loadWrapper = async () => await import('./amplitude');

beforeEach(() => {
  vi.resetModules();
  amplitudeMock.identifySetCalls.length = 0;
  nativeContextMock.context = null;
});

afterEach(() => {
  vi.unstubAllEnvs();
});

describe('initAnalytics', () => {
  it('키가 없으면 SDK를 초기화하지 않는다 (no-op 모드)', async () => {
    vi.stubEnv('NEXT_PUBLIC_AMPLITUDE_API_KEY', '');
    const { initAnalytics } = await loadWrapper();

    initAnalytics();

    expect(amplitudeMock.initAll).not.toHaveBeenCalled();
  });

  it('키가 있으면 세션 리플레이 100%·오토캡처 off·짧은 회원번호 허용으로 초기화한다', async () => {
    vi.stubEnv('NEXT_PUBLIC_AMPLITUDE_API_KEY', 'test-key');
    const { initAnalytics } = await loadWrapper();

    initAnalytics();

    expect(amplitudeMock.initAll).toHaveBeenCalledWith('test-key', {
      analytics: {
        // 백엔드 회원번호(1~4자리)가 기본 5자 제한에 걸려 400으로 거절되던 것
        minIdLength: 1,
        autocapture: false,
      },
      sessionReplay: { sampleRate: 1 },
    });
  });

  it('웹 배포 버전(커밋 SHA)이 있으면 공통 속성 web_version으로 실린다', async () => {
    vi.stubEnv('NEXT_PUBLIC_AMPLITUDE_API_KEY', 'test-key');
    vi.stubEnv('NEXT_PUBLIC_VERCEL_GIT_COMMIT_SHA', 'abcdef1234567890');
    const { track } = await loadWrapper();

    track('Logout Completed');

    expect(amplitudeMock.track).toHaveBeenCalledWith(
      'Logout Completed',
      expect.objectContaining({ web_version: 'abcdef1' }),
    );
  });

  it('중복 호출해도 한 번만 초기화한다', async () => {
    vi.stubEnv('NEXT_PUBLIC_AMPLITUDE_API_KEY', 'test-key');
    const { initAnalytics } = await loadWrapper();

    initAnalytics();
    initAnalytics();

    expect(amplitudeMock.initAll).toHaveBeenCalledTimes(1);
  });
});

describe('track', () => {
  it('키가 없으면 SDK로 보내지 않는다', async () => {
    vi.stubEnv('NEXT_PUBLIC_AMPLITUDE_API_KEY', '');
    const { track } = await loadWrapper();

    track('Logout Completed');

    expect(amplitudeMock.track).not.toHaveBeenCalled();
  });

  it('셸 안이면 네이티브 컨텍스트를 공통 속성으로 병합한다', async () => {
    vi.stubEnv('NEXT_PUBLIC_AMPLITUDE_API_KEY', 'test-key');
    nativeContextMock.context = {
      platform: 'ios',
      appVersion: '1.2.0',
      buildNumber: '42',
      bridgeVersion: 1,
    };
    const { track } = await loadWrapper();

    track('NPS Survey Submitted', { score: 5, has_comment: false });

    expect(amplitudeMock.track).toHaveBeenCalledWith('NPS Survey Submitted', {
      surface: 'app',
      platform: 'ios',
      app_version: '1.2.0',
      build_number: '42',
      score: 5,
      has_comment: false,
    });
  });

  it('일반 브라우저면 platform을 web으로 보내고 앱 버전은 싣지 않는다', async () => {
    vi.stubEnv('NEXT_PUBLIC_AMPLITUDE_API_KEY', 'test-key');
    const { track } = await loadWrapper();

    track('Logout Completed');

    expect(amplitudeMock.track).toHaveBeenCalledWith('Logout Completed', {
      surface: 'browser',
      platform: 'web',
    });
  });

  it('개발 환경에서는 키가 있어도 어떤 이벤트를 쏘는지 콘솔에 같이 찍는다', async () => {
    vi.stubEnv('NEXT_PUBLIC_AMPLITUDE_API_KEY', 'test-key');
    vi.stubEnv('NODE_ENV', 'development');
    const debugSpy = vi.spyOn(console, 'debug').mockImplementation(() => {});
    const { track } = await loadWrapper();

    track('Logout Completed');

    expect(debugSpy).toHaveBeenCalledWith(
      '[analytics]',
      'Logout Completed',
      expect.objectContaining({ surface: 'browser' }),
    );
    expect(amplitudeMock.track).toHaveBeenCalled();
  });
});

describe('identifyUser / resetUser', () => {
  it('userId를 문자열로 setUserId하고 provider를 유저 속성으로 세팅한다', async () => {
    vi.stubEnv('NEXT_PUBLIC_AMPLITUDE_API_KEY', 'test-key');
    const { identifyUser } = await loadWrapper();

    identifyUser(42, { provider: 'kakao' });

    expect(amplitudeMock.setUserId).toHaveBeenCalledWith('42');
    expect(amplitudeMock.identifySetCalls).toContainEqual([
      'provider',
      'kakao',
    ]);
  });

  it('resetUser는 SDK reset을 호출한다', async () => {
    vi.stubEnv('NEXT_PUBLIC_AMPLITUDE_API_KEY', 'test-key');
    const { resetUser } = await loadWrapper();

    resetUser();

    expect(amplitudeMock.reset).toHaveBeenCalled();
  });

  it('키가 없으면 유저 식별도 no-op이다', async () => {
    vi.stubEnv('NEXT_PUBLIC_AMPLITUDE_API_KEY', '');
    const { identifyUser, resetUser } = await loadWrapper();

    identifyUser(42, { provider: 'kakao' });
    resetUser();

    expect(amplitudeMock.setUserId).not.toHaveBeenCalled();
    expect(amplitudeMock.reset).not.toHaveBeenCalled();
  });
});
