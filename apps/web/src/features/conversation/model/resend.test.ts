// 답변 재전송 규칙 — 끊기면 같은 답변을 다시 보내고, 서버가 아직 만드는 중이면 기다렸다 받는다
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { ApiError } from '@/shared/api/api-error';

import { sendWithResend } from './resend';

const disconnected = () => new TypeError('Load failed');
const generating = () =>
  new ApiError(
    '같은 발화의 다음 질문을 생성하고 있습니다.',
    409,
    '/x',
    'CONFLICT',
  );

beforeEach(() => {
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
});

describe('sendWithResend', () => {
  it('연결이 끊겼다가 다시 보내 성공하면 그 응답을 돌려준다', async () => {
    const send = vi
      .fn()
      .mockRejectedValueOnce(disconnected())
      .mockResolvedValueOnce('응답');

    const result = sendWithResend(send);
    await vi.advanceTimersByTimeAsync(1000);

    await expect(result).resolves.toBe('응답');
    expect(send).toHaveBeenCalledTimes(2);
  });

  it('연결이 계속 끊기면 두 번 더 보내고 멈춘다', async () => {
    const send = vi.fn().mockRejectedValue(disconnected());

    const result = sendWithResend(send);
    const settled = expect(result).rejects.toThrow('Load failed');
    await vi.advanceTimersByTimeAsync(10_000);

    await settled;
    expect(send).toHaveBeenCalledTimes(3);
  });

  it('서버가 아직 대답을 만드는 중이면 2초마다 다시 보내 받는다', async () => {
    const send = vi
      .fn()
      .mockRejectedValueOnce(disconnected())
      .mockRejectedValueOnce(generating())
      .mockRejectedValueOnce(generating())
      .mockResolvedValueOnce('응답');

    const result = sendWithResend(send);
    await vi.advanceTimersByTimeAsync(1000 + 2000 + 2000);

    await expect(result).resolves.toBe('응답');
    expect(send).toHaveBeenCalledTimes(4);
  });

  it('처음 실패부터 10초가 지나면 더 기다리지 않고 멈춘다', async () => {
    const send = vi.fn().mockRejectedValue(generating());

    const result = sendWithResend(send);
    const settled = expect(result).rejects.toThrow('생성하고 있습니다');
    await vi.advanceTimersByTimeAsync(30_000);

    await settled;
    // 0초에 실패한 뒤 2·4·6·8·10초에 다시 보낸다
    expect(send).toHaveBeenCalledTimes(6);
  });

  it.each([
    ['서버 에러', new ApiError('서버 오류', 500, '/x', 'INTERNAL_ERROR')],
    [
      '이미 끝난 대화',
      new ApiError(
        '이미 완료된 세션입니다.',
        409,
        '/x',
        'SESSION_ALREADY_COMPLETED',
      ),
    ],
    [
      '권한 없음',
      new ApiError('접근 권한이 없습니다.', 403, '/x', 'FORBIDDEN'),
    ],
  ])('%s면 다시 보내지 않고 바로 멈춘다', async (_, error) => {
    const send = vi.fn().mockRejectedValue(error);

    await expect(sendWithResend(send)).rejects.toBe(error);
    expect(send).toHaveBeenCalledTimes(1);
  });

  it('기다리는 사이 대화를 떠나면 더 보내지 않는다', async () => {
    const send = vi.fn().mockRejectedValue(disconnected());
    let left = false;

    const result = sendWithResend(send, { isCancelled: () => left });
    const settled = expect(result).rejects.toThrow('Load failed');
    left = true;
    await vi.advanceTimersByTimeAsync(10_000);

    await settled;
    expect(send).toHaveBeenCalledTimes(1);
  });
});
