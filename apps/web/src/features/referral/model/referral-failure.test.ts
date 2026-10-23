// 코드 확인·등록 실패를 화면 반응으로 바꾸는 규칙 테스트
import { describe, expect, it } from 'vitest';

import { ApiError } from '@/shared/api/api-error';

import { isSettledSkipRejection, referralFailureOf } from './referral-failure';

const apiError = (status: number, code?: string) =>
  new ApiError('실패', status, '/api/v1/referrals/registration', code);

describe('referralFailureOf', () => {
  it.each([
    ['REFERRAL_CODE_INVALID', '코드를 한 번 더 확인해 보세요', false],
    ['REFERRAL_SELF_INVITE', '내 초대 코드는 넣을 수 없어요', false],
    ['REFERRAL_RATE_LIMITED', '잠시 뒤 다시 해 주세요', true],
    ['REFERRAL_DISABLED', '지금은 초대 보상을 받을 수 없어요', false],
  ])(
    '%s면 그 이유를 칸 아래에 알리는 예상한 실패다 — 다시 보내도 되는가는 %s',
    (code, message, retryable) => {
      expect(referralFailureOf(apiError(400, code))).toEqual({
        kind: 'message',
        message,
        expected: true,
        retryable,
      });
    },
  );

  it('코드 형식이 틀렸다는 공용 검증 오류도 틀린 코드처럼 알리고 다시 보내지 않는다', () => {
    expect(referralFailureOf(apiError(400, 'VALIDATION_FAILED'))).toEqual({
      kind: 'message',
      message: '코드를 한 번 더 확인해 보세요',
      expected: true,
      retryable: false,
    });
  });

  it('보상 조건이 바뀌었으면 조건을 다시 확인하게 한다', () => {
    expect(referralFailureOf(apiError(409, 'REFERRAL_POLICY_CHANGED'))).toEqual(
      { kind: 'recheck' },
    );
  });

  it('이미 등록된 사람이면 알리지 않고 다음 단계로 넘긴다', () => {
    expect(
      referralFailureOf(apiError(409, 'REFERRAL_ALREADY_REGISTERED')),
    ).toEqual({ kind: 'move_on', notice: null });
  });

  it('등록할 수 없게 됐으면 한 줄 알리고 다음 단계로 넘긴다 — 등록된 줄 알면 안 된다', () => {
    expect(
      referralFailureOf(apiError(409, 'REFERRAL_REGISTRATION_CLOSED')),
    ).toEqual({
      kind: 'move_on',
      notice: '지금은 초대 코드를 등록할 수 없어요',
    });
  });

  it('모르는 실패면 다시 시도하라고 알리고, 같은 코드로 다시 보낼 수 있는 예상하지 못한 실패로 표시한다', () => {
    expect(referralFailureOf(new Error('network'))).toEqual({
      kind: 'message',
      message: '확인하지 못했어요. 다시 시도해 주세요',
      expected: false,
      retryable: true,
    });
  });
});

describe('isSettledSkipRejection', () => {
  it.each(['REFERRAL_ALREADY_REGISTERED', 'REFERRAL_REGISTRATION_CLOSED'])(
    '건너뛰기를 %s로 거절하면 이미 끝난 상태라 경고로 올리지 않는다',
    (code) => {
      expect(isSettledSkipRejection(apiError(409, code))).toBe(true);
    },
  );

  it('그 밖의 실패는 경고로 올린다', () => {
    expect(isSettledSkipRejection(new Error('network'))).toBe(false);
    expect(isSettledSkipRejection(apiError(500, 'INTERNAL_ERROR'))).toBe(false);
  });
});
