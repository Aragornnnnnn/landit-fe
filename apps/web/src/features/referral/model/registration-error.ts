// 코드 확인·등록 실패를 화면 반응으로 바꾼다 — 칸 아래 안내, 조건 다시 확인, 그냥 다음 단계 셋 중 하나
import { ApiError } from '@/shared/api/api-error';

export type RegistrationFailure =
  | { kind: 'message'; message: string }
  // 확인한 뒤 정책이 바뀌었다 — 새 조건으로 다시 보여 주고 한 번 더 누르게 한다
  | { kind: 'recheck' }
  // 이미 등록됐거나 등록할 수 없는 온보딩이다 — 붙잡을 이유가 없다
  | { kind: 'move_on' };

const MESSAGE_BY_CODE: Record<string, string> = {
  REFERRAL_CODE_INVALID: '코드를 다시 확인해 주세요',
  REFERRAL_SELF_INVITE: '내 초대 코드는 넣을 수 없어요',
  REFERRAL_RATE_LIMITED: '잠시 뒤 다시 해 주세요',
  REFERRAL_DISABLED: '지금은 초대 보상을 받을 수 없어요',
};

const RETRY_MESSAGE = '확인하지 못했어요. 다시 시도해 주세요';

export const registrationFailureOf = (error: unknown): RegistrationFailure => {
  const code = error instanceof ApiError ? error.code : undefined;
  if (code === 'REFERRAL_POLICY_CHANGED') return { kind: 'recheck' };
  if (
    code === 'REFERRAL_ALREADY_REGISTERED' ||
    code === 'REFERRAL_REGISTRATION_CLOSED'
  )
    return { kind: 'move_on' };
  return {
    kind: 'message',
    message: (code && MESSAGE_BY_CODE[code]) ?? RETRY_MESSAGE,
  };
};
