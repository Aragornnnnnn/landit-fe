// review-prompt — 플랫폼별로 카드를 청하고 떴는지 판정하는 계약 검증. iOS는 네이티브 모듈, Android는 걸린 시간
import { Platform } from 'react-native';
import { requireOptionalNativeModule } from 'expo';
import * as StoreReview from 'expo-store-review';

jest.mock('expo', () => ({ requireOptionalNativeModule: jest.fn() }));
jest.mock('expo-store-review', () => ({
  isAvailableAsync: jest.fn(),
  requestReview: jest.fn(),
}));

const requireModuleMock = requireOptionalNativeModule as jest.Mock;
const isAvailableMock = StoreReview.isAvailableAsync as jest.Mock;
const requestReviewMock = StoreReview.requestReview as jest.Mock;

// 모듈 상수(iosModule)는 import 시점에 정해진다 — 케이스마다 새로 불러온다
const load = (): typeof import('./index') => {
  let loaded: typeof import('./index') | undefined;
  jest.isolateModules(() => {
    loaded = require('./index') as typeof import('./index');
  });
  return loaded!;
};

// 시계를 흉내 낸다 — 호출마다 지정한 시각을 돌려준다
const clock = (...ticks: number[]) => {
  const queue = [...ticks];
  return () => queue.shift() ?? ticks[ticks.length - 1];
};

beforeEach(() => {
  requireModuleMock.mockReset();
  isAvailableMock.mockReset();
  requestReviewMock.mockReset();
});

describe('requestReviewPrompt', () => {
  it('iOS 모듈이 있으면 그 판정을 그대로 돌려준다', async () => {
    requireModuleMock.mockReturnValue({
      requestReview: jest.fn().mockResolvedValue('shown'),
    });
    const { requestReviewPrompt } = load();

    await expect(requestReviewPrompt()).resolves.toBe('shown');
    expect(requestReviewMock).not.toHaveBeenCalled();
  });

  describe('Android', () => {
    beforeEach(() => {
      requireModuleMock.mockReturnValue(null);
      Platform.OS = 'android';
    });

    it('Play 스토어가 없으면 unavailable이다', async () => {
      isAvailableMock.mockResolvedValue(false);
      const { requestReviewPrompt } = load();

      await expect(requestReviewPrompt()).resolves.toBe('unavailable');
      expect(requestReviewMock).not.toHaveBeenCalled();
    });

    it('요청이 바로 끝나면 안 뜬 것이다 — Play가 카드를 안 주면 수백 ms 안에 돌아온다', async () => {
      isAvailableMock.mockResolvedValue(true);
      requestReviewMock.mockResolvedValue(undefined);
      const { requestReviewPrompt, ANDROID_SHOWN_THRESHOLD_MS } = load();

      await expect(
        requestReviewPrompt(clock(0, ANDROID_SHOWN_THRESHOLD_MS - 1)),
      ).resolves.toBe('not_shown');
    });

    it('요청이 오래 걸렸으면 뜬 것이다 — 사용자가 별을 고르거나 닫을 때까지 붙잡힌다', async () => {
      isAvailableMock.mockResolvedValue(true);
      requestReviewMock.mockResolvedValue(undefined);
      const { requestReviewPrompt, ANDROID_SHOWN_THRESHOLD_MS } = load();

      await expect(
        requestReviewPrompt(clock(0, ANDROID_SHOWN_THRESHOLD_MS)),
      ).resolves.toBe('shown');
    });
  });

  it('iOS 모듈도 없고 Android도 아니면 unavailable이다', async () => {
    requireModuleMock.mockReturnValue(null);
    Platform.OS = 'ios';
    const { requestReviewPrompt } = load();

    await expect(requestReviewPrompt()).resolves.toBe('unavailable');
  });
});
