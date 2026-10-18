// store-review — 브릿지 REQUEST_REVIEW를 네이티브 카드 요청으로 잇고, 겹치는 요청은 하나로 묶는 계약 검증
import { requestReviewPrompt } from '../../modules/review-prompt';
import { requestStoreReview } from './store-review';

jest.mock('../../modules/review-prompt', () => ({
  requestReviewPrompt: jest.fn(),
}));
const requestReviewPromptMock = requestReviewPrompt as jest.Mock;

beforeEach(() => requestReviewPromptMock.mockReset());

describe('requestStoreReview', () => {
  it('모듈의 판정을 그대로 돌려준다', async () => {
    requestReviewPromptMock.mockResolvedValue('shown');

    await expect(requestStoreReview()).resolves.toBe('shown');
  });

  it('카드를 기다리는 사이 또 요청이 오면 새로 띄우지 않고 같은 결과를 준다 — 연타로 카드가 두 번 뜨지 않게', async () => {
    let resolve: (value: 'shown' | 'not_shown') => void = () => {};
    requestReviewPromptMock.mockReturnValue(
      new Promise((r) => {
        resolve = r;
      }),
    );

    const first = requestStoreReview();
    const second = requestStoreReview();
    resolve('not_shown');

    await expect(first).resolves.toBe('not_shown');
    await expect(second).resolves.toBe('not_shown');
    expect(requestReviewPromptMock).toHaveBeenCalledTimes(1);
  });

  it('끝난 뒤의 요청은 다시 띄운다', async () => {
    requestReviewPromptMock.mockResolvedValue('shown');
    await requestStoreReview();

    await requestStoreReview();

    expect(requestReviewPromptMock).toHaveBeenCalledTimes(2);
  });

  it('모듈이 던지면 unavailable로 답한다 — 웹이 스토어로 보내게', async () => {
    requestReviewPromptMock.mockRejectedValue(new Error('boom'));

    await expect(requestStoreReview()).resolves.toBe('unavailable');
  });
});
