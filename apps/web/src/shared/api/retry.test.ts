// retryUnlessClientError — 4xx는 다시 묻지 않고, 나머지는 두 번까지 다시 묻는다
import { describe, expect, it } from 'vitest';

import { ApiError } from './api-error';
import { isRetriableFailure, retryUnlessClientError } from './retry';

const apiError = (status: number) => new ApiError('실패', status, '/x');

describe('isRetriableFailure', () => {
  it.each([
    { label: '4xx', error: apiError(404), expected: false },
    { label: '5xx', error: apiError(503), expected: true },
    { label: '네트워크 실패', error: new Error('network'), expected: true },
  ])('$label 이면 $expected', ({ error, expected }) => {
    expect(isRetriableFailure(error)).toBe(expected);
  });
});

describe('retryUnlessClientError', () => {
  it('4xx면 첫 실패에도 다시 묻지 않는다', () => {
    expect(retryUnlessClientError(0, apiError(403))).toBe(false);
  });

  it.each([
    { failureCount: 1, expected: true },
    { failureCount: 2, expected: false },
  ])(
    '5xx는 두 번까지만 다시 묻는다 (실패 $failureCount번째 → $expected)',
    ({ failureCount, expected }) => {
      expect(retryUnlessClientError(failureCount, apiError(500))).toBe(
        expected,
      );
    },
  );
});
