// 처리된 실패를 Sentry로 보고하는 단일 통로 — 도메인 코드가 벤더 SDK를 직접 알지 않게 한다
import * as Sentry from '@sentry/nextjs';

import { ApiError } from '@/shared/api/api-error';

// API 실패면 endpoint·status·code를 태그로 승격한다
const apiTags = (failure: unknown) =>
  failure instanceof ApiError
    ? {
        api_endpoint: failure.endpoint,
        api_status: String(failure.status),
        ...(failure.code && { api_code: failure.code }),
      }
    : undefined;

// 연산이 실패로 끝났다 — 유저 데이터 유실·진행 불가
export const reportError = (error: unknown) => {
  Sentry.captureException(error, { tags: apiTags(error) });
};

// 비정상이지만 감내하고 계속한다 — 예외가 없는 상황은 문자열로 넘긴다
export const reportWarning = (
  failure: unknown,
  extra?: Record<string, unknown>,
) => {
  if (typeof failure === 'string') {
    Sentry.captureMessage(failure, { level: 'warning', extra });
  } else {
    Sentry.captureException(failure, {
      level: 'warning',
      extra,
      tags: apiTags(failure),
    });
  }
};
