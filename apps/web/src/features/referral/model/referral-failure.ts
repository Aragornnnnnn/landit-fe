// 코드 확인·등록 실패를 화면 반응으로 바꾼다 — 칸 아래 안내, 조건 다시 확인, 다음 단계로 넘김 셋 중 하나
import { ApiError } from '@/shared/api/api-error';

export type ReferralFailure =
  // 칸 아래에 알린다. 예상한 실패(틀린 코드 등)가 아니면 모니터링에 남긴다.
  // retryable — 같은 코드를 다시 넣으면 다시 보내도 되는가(횟수 제한·네트워크). 틀린 코드는 다시 보내지 않는다
  | { kind: 'message'; message: string; expected: boolean; retryable: boolean }
  // 확인한 뒤 정책이 바뀌었다 — 새 조건으로 다시 보여 주고 한 번 더 누르게 한다
  | { kind: 'recheck' }
  // 붙잡을 이유가 없다 — 이미 등록됐으면 조용히, 등록할 수 없게 됐으면 한 줄 알리고 넘어간다
  | { kind: 'move_on'; notice: string | null };

const MESSAGE_BY_CODE: Record<string, string> = {
  REFERRAL_CODE_INVALID: '코드를 다시 확인해 주세요',
  REFERRAL_SELF_INVITE: '내 초대 코드는 넣을 수 없어요',
  REFERRAL_RATE_LIMITED: '잠시 뒤 다시 해 주세요',
  REFERRAL_DISABLED: '지금은 초대 보상을 받을 수 없어요',
};

const RETRY_MESSAGE = '확인하지 못했어요. 다시 시도해 주세요';
const CLOSED_NOTICE = '지금은 초대 코드를 등록할 수 없어요';

export const referralFailureOf = (error: unknown): ReferralFailure => {
  const code = error instanceof ApiError ? error.code : undefined;
  if (code === 'REFERRAL_POLICY_CHANGED') return { kind: 'recheck' };
  if (code === 'REFERRAL_ALREADY_REGISTERED')
    return { kind: 'move_on', notice: null };
  if (code === 'REFERRAL_REGISTRATION_CLOSED')
    return { kind: 'move_on', notice: CLOSED_NOTICE };
  const known = code ? MESSAGE_BY_CODE[code] : undefined;
  return known
    ? {
        kind: 'message',
        message: known,
        expected: true,
        retryable: code === 'REFERRAL_RATE_LIMITED',
      }
    : {
        kind: 'message',
        message: RETRY_MESSAGE,
        expected: false,
        retryable: true,
      };
};
