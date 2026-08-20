// 학습 완료 요청 계약 — 스몰톡 표현만 세션 ID를 바디에 실어 서버가 세션 연결을 검증하게 한다
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { api } from '@/shared/api/client';

import { finishExpression } from './finish';

vi.mock('@/shared/api/client', () => ({
  api: { post: vi.fn() },
}));

const post = vi.mocked(api.post);

beforeEach(() => {
  post.mockReset();
  post.mockResolvedValue({} as never);
});

describe('finishExpression', () => {
  it('시나리오 표현은 바디 없이 완료를 보낸다', async () => {
    // when — 시나리오는 순차 잠금이라 서버가 표현 ID만으로 처리한다
    await finishExpression(171);

    // then
    expect(post).toHaveBeenCalledWith(
      '/api/v1/expressions/171/learning-finish',
    );
  });

  it('스몰톡 표현은 세션 ID를 바디에 실어 보낸다', async () => {
    // when — 스몰톡 표현은 어느 세션 것인지 서버가 검증해야 완료가 기록된다
    await finishExpression(171, 362);

    // then
    expect(post).toHaveBeenCalledWith(
      '/api/v1/expressions/171/learning-finish',
      { freeTalkSessionId: 362 },
    );
  });
});
