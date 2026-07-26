// monitoring — 보고 통로가 레벨·API 태그를 붙여 Sentry로 넘기는지 검증
import { describe, expect, it, vi } from 'vitest';

import { ApiError } from '@/shared/api/api-error';

import { reportError, reportWarning } from './report';

const sentryMock = vi.hoisted(() => ({
  captureException: vi.fn(),
  captureMessage: vi.fn(),
}));
vi.mock('@sentry/nextjs', () => sentryMock);

describe('monitoring', () => {
  it('reportError는 예외를 그대로 보고한다 (error 레벨 = 알림 대상)', () => {
    const error = new Error('boom');

    reportError(error);

    expect(sentryMock.captureException).toHaveBeenCalledWith(error, {
      tags: undefined,
    });
  });

  it('ApiError면 endpoint·status·code를 태그로 승격한다 — 이슈 필터·백엔드 상관관계용', () => {
    const error = new ApiError(
      '끝난 세션이에요.',
      409,
      '/api/v1/sessions',
      'SESSION_ALREADY_ENDED',
    );

    reportError(error);

    expect(sentryMock.captureException).toHaveBeenCalledWith(error, {
      tags: {
        api_endpoint: '/api/v1/sessions',
        api_status: '409',
        api_code: 'SESSION_ALREADY_ENDED',
      },
    });
  });

  it('경로의 ID는 :id로 묶는다 — 세션마다 태그가 갈리면 같은 API 실패가 집계되지 않는다', () => {
    const error = new ApiError(
      '서버 오류가 발생했어요. (500)',
      500,
      '/api/v1/sessions/145/messages/7/inner-thought',
    );

    reportError(error);

    expect(sentryMock.captureException).toHaveBeenCalledWith(error, {
      tags: expect.objectContaining({
        api_endpoint: '/api/v1/sessions/:id/messages/:id/inner-thought',
      }),
    });
  });

  it('reportWarning은 warning 레벨로 보고한다 (수집만, 알림 없음)', () => {
    const error = new Error('flaky');

    reportWarning(error);

    expect(sentryMock.captureException).toHaveBeenCalledWith(error, {
      level: 'warning',
      extra: undefined,
      tags: undefined,
    });
  });

  it('reportWarning에 문자열을 주면 메시지로 보고한다 — 예외가 없는 상황(시간초과 등)용', () => {
    reportWarning('속마음 생성 폴백 (timeout)', { sessionId: 1 });

    expect(sentryMock.captureMessage).toHaveBeenCalledWith(
      '속마음 생성 폴백 (timeout)',
      { level: 'warning', extra: { sessionId: 1 } },
    );
  });
});
