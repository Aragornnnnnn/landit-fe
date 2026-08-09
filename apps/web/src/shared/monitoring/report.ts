// 처리된 실패를 Sentry로 보고하는 단일 통로 — 도메인 코드가 벤더 SDK를 직접 알지 않게 한다
import * as Sentry from '@sentry/nextjs';

import { ApiError } from '@/shared/api/api-error';

// 경로의 ID를 :id로 묶는다 — 세션마다 태그가 갈리면 같은 API 실패가 집계되지 않는다
const routeOf = (endpoint: string) =>
  endpoint.replace(/\/\d+(?=\/|$)/g, '/:id');

// API 실패면 endpoint·status·code를 태그로 승격한다
const apiTags = (failure: unknown) =>
  failure instanceof ApiError
    ? {
        api_endpoint: routeOf(failure.endpoint),
        api_status: String(failure.status),
        ...(failure.code && { api_code: failure.code }),
      }
    : undefined;

/**
 * 연산이 실패로 끝났음을 Sentry에 보고한다 — 유저 데이터 유실·진행 불가 수준(알림 대상).
 *
 * @param error 잡은 예외. `ApiError`면 endpoint·status·code가 태그로 승격돼 이슈 필터링에 쓰인다
 * @param extra 이슈에 첨부할 추가 컨텍스트 (검색은 안 되고 상세에서만 보인다)
 */
export const reportError = (
  error: unknown,
  extra?: Record<string, unknown>,
) => {
  Sentry.captureException(error, { tags: apiTags(error), extra });
};

/**
 * 비정상이지만 감내하고 계속하는 상황을 Sentry에 warning 레벨로 보고한다.
 *
 * @param failure 잡은 예외, 또는 예외가 없는 상황이면 설명 문자열
 * @param extra 이슈에 첨부할 추가 컨텍스트 (검색은 안 되고 상세에서만 보인다)
 */
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
