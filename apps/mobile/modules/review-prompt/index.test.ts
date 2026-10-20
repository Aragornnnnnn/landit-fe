// review-prompt — 네이티브 모듈의 판정을 그대로 넘기고, 모듈이 없으면 카드가 없다고 답하는 계약 검증
import { requireOptionalNativeModule } from 'expo';

jest.mock('expo', () => ({ requireOptionalNativeModule: jest.fn() }));

const requireModuleMock = requireOptionalNativeModule as jest.Mock;

// 모듈 상수(nativeModule)는 import 시점에 정해진다 — 케이스마다 새로 불러온다
const load = (): typeof import('./index') => {
  let loaded: typeof import('./index') | undefined;
  jest.isolateModules(() => {
    loaded = require('./index') as typeof import('./index');
  });
  return loaded!;
};

beforeEach(() => requireModuleMock.mockReset());

describe('requestReviewPrompt', () => {
  it('네이티브 모듈이 있으면 그 판정을 그대로 돌려준다', async () => {
    requireModuleMock.mockReturnValue({
      requestReview: jest.fn().mockResolvedValue('shown'),
    });
    const { requestReviewPrompt } = load();

    await expect(requestReviewPrompt()).resolves.toBe('shown');
  });

  it('네이티브 모듈이 없으면 unavailable이다 — 웹이 스토어로 보내게', async () => {
    requireModuleMock.mockReturnValue(null);
    const { requestReviewPrompt } = load();

    await expect(requestReviewPrompt()).resolves.toBe('unavailable');
  });
});
