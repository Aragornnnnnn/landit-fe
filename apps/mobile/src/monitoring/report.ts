// 셸의 실패를 Sentry로 보고하는 단일 통로 — 도메인 코드가 벤더 SDK를 직접 알지 않게 한다 (웹 shared/monitoring/report.ts와 같은 모양)
import * as Sentry from '@sentry/react-native';

/**
 * 연산이 실패로 끝났음을 Sentry에 보고한다 — 결제·복원 실패, 브릿지 핸들러 예외 수준(알림 대상).
 *
 * @param error 잡은 예외
 * @param extra 이슈에 첨부할 추가 컨텍스트 (검색은 안 되고 상세에서만 보인다)
 */
export const reportError = (
  error: unknown,
  extra?: Record<string, unknown>,
) => {
  Sentry.captureException(error, { extra });
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
    Sentry.captureException(failure, { level: 'warning', extra });
  }
};

/**
 * 이후 이슈에 붙을 사용자를 정한다 — RevenueCat app_user_id와 같은 값이라 웹훅 미매칭 건을 사용자 단위로 좇을 수 있다.
 *
 * @param userId 로그인 사용자 id. null이면 로그아웃으로 보고 사용자를 푼다
 */
export const setMonitoringUser = (userId: string | null) => {
  Sentry.setUser(userId ? { id: userId } : null);
};
