// 코드 확인·등록 실패를 화면 반응으로 바꾸는 규칙 테스트
import { describe, expect, it } from 'vitest';

import { ApiError } from '@/shared/api/api-error';

import { registrationFailureOf } from './registration-error';

const apiError = (status: number, code?: string) =>
  new ApiError('실패', status, '/api/v1/referrals/registration', code);

describe('registrationFailureOf', () => {
  it.each([
    ['REFERRAL_CODE_INVALID', '코드를 다시 확인해 주세요'],
    ['REFERRAL_SELF_INVITE', '내 초대 코드는 넣을 수 없어요'],
    ['REFERRAL_RATE_LIMITED', '잠시 뒤 다시 해 주세요'],
    ['REFERRAL_DISABLED', '지금은 초대 보상을 받을 수 없어요'],
  ])('%s면 그 이유를 칸 아래에 알린다', (code, message) => {
    expect(registrationFailureOf(apiError(400, code))).toEqual({
      kind: 'message',
      message,
    });
  });

  it('보상 조건이 바뀌었으면 조건을 다시 확인하게 한다', () => {
    expect(
      registrationFailureOf(apiError(409, 'REFERRAL_POLICY_CHANGED')),
    ).toEqual({ kind: 'recheck' });
  });

  it.each(['REFERRAL_ALREADY_REGISTERED', 'REFERRAL_REGISTRATION_CLOSED'])(
    '%s면 더 할 일이 없으니 다음 단계로 넘긴다',
    (code) => {
      expect(registrationFailureOf(apiError(409, code))).toEqual({
        kind: 'move_on',
      });
    },
  );

  it('모르는 실패면 다시 시도하라고 알린다', () => {
    expect(registrationFailureOf(new Error('network'))).toEqual({
      kind: 'message',
      message: '확인하지 못했어요. 다시 시도해 주세요',
    });
  });
});
