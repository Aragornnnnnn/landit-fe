// 소셜 로그인 실패를 웹 회신 모양으로 바꾸고, 사용자 취소가 아니면 보고한다
import type { NativeToWebMessage } from '@landit/bridge';

import { reportError } from '../../../monitoring/report';
import type { SocialProvider } from '../index';
import { SocialLoginError } from './errors';

/** 웹에 회신할 실패 모양(SOCIAL_LOGIN_ERROR 페이로드) — 취소면 웹이 에러 배너를 띄우지 않는다 */
export type SocialLoginFailure = Omit<
  Extract<NativeToWebMessage, { type: 'SOCIAL_LOGIN_ERROR' }>,
  'type'
>;

/**
 * @param error provider SDK나 검증 단계가 던진 예외
 * @param provider 어느 로그인이었는지 — 이슈에 첨부된다
 */
export const toSocialLoginFailure = (
  error: unknown,
  provider: SocialProvider,
): SocialLoginFailure => {
  const cancelled = error instanceof SocialLoginError && error.cancelled;
  if (!cancelled) reportError(error, { provider });
  return {
    message:
      error instanceof SocialLoginError
        ? error.message
        : '로그인 중 문제가 생겼어요.',
    cancelled,
  };
};
