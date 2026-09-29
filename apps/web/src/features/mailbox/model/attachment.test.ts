// 사진 담기 규칙 — 남은 칸만큼 앞에서부터 채우고, 넘쳤는지·너무 큰지·왜 못 보냈는지 알려준다
import { describe, expect, it } from 'vitest';

import { ApiError } from '@/shared/api/api-error';

import {
  exceedsSendLimit,
  MAX_ATTACHMENTS,
  MAX_SEND_BYTES,
  sendFailureMessage,
  takeAttachable,
} from './attachment';

describe('takeAttachable', () => {
  it('남은 칸 안이면 고른 사진을 전부 담는다', () => {
    const result = takeAttachable(1, ['a', 'b']);

    expect(result).toEqual({ taken: ['a', 'b'], overflowed: false });
  });

  it('남은 칸보다 많이 고르면 앞에서부터 채우고 넘쳤다고 알린다', () => {
    const result = takeAttachable(1, ['a', 'b', 'c', 'd']);

    expect(result).toEqual({ taken: ['a', 'b'], overflowed: true });
  });

  it('이미 꽉 찼으면 하나도 담지 않고 넘쳤다고 알린다', () => {
    const result = takeAttachable(MAX_ATTACHMENTS, ['a']);

    expect(result).toEqual({ taken: [], overflowed: true });
  });
});

describe('exceedsSendLimit', () => {
  const sized = (size: number) => ({ size });

  it('합계가 한도 안이면 보낼 수 있다', () => {
    expect(exceedsSendLimit([sized(1_000_000), sized(1_000_000)])).toBe(false);
  });

  it('합계가 한도를 넘으면 막는다', () => {
    expect(exceedsSendLimit([sized(MAX_SEND_BYTES), sized(1)])).toBe(true);
  });
});

describe('sendFailureMessage', () => {
  const failure = (status: number, code?: string) =>
    new ApiError('실패', status, '/api/v1/mailbox/feedbacks', code);

  it('사진을 서버가 거부하면 다른 사진으로 바꾸라고 한다', () => {
    expect(sendFailureMessage(failure(400, 'VALIDATION_FAILED'), 1)).toBe(
      '보낼 수 없는 사진이 있어요. 다른 사진으로 바꿔 주세요.',
    );
  });

  it.each([[413], [502]])(
    '사진이 있을 때 %s로 끊기면 용량을 줄이라고 한다',
    (status) => {
      expect(sendFailureMessage(failure(status), 2)).toBe(
        '사진 용량이 너무 커요. 한 장을 빼고 다시 보내 주세요.',
      );
    },
  );

  it('사진이 없으면 사진 탓을 하지 않는다', () => {
    expect(sendFailureMessage(failure(400, 'VALIDATION_FAILED'), 0)).toBe(
      '보내지 못했어요. 잠시 후 다시 시도해 주세요.',
    );
  });

  it('네트워크 오류처럼 서버 응답이 없으면 다시 시도하라고 한다', () => {
    expect(sendFailureMessage(new TypeError('Failed to fetch'), 2)).toBe(
      '보내지 못했어요. 잠시 후 다시 시도해 주세요.',
    );
  });
});
