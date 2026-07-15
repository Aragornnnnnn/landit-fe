// submitNps — 점수·의견을 백엔드 계약(opinionText, 공백은 null)으로 매핑하는지 검증
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { api } from '@/shared/api/client';

import { submitNps } from './nps';

vi.mock('@/shared/api/client', () => ({ api: { post: vi.fn() } }));

const postMock = vi.mocked(api.post);

describe('submitNps', () => {
  beforeEach(() => {
    postMock.mockResolvedValue(undefined);
  });

  it('의견이 있으면 앞뒤 공백을 걷어낸 opinionText로 제출한다', () => {
    submitNps(4, '  발음 피드백이 좋아요  ');

    expect(postMock).toHaveBeenCalledWith('/api/v1/nps', {
      score: 4,
      opinionText: '발음 피드백이 좋아요',
    });
  });

  it('의견이 공백뿐이거나 없으면 opinionText를 null로 보낸다', () => {
    submitNps(5, '   ');
    submitNps(5);

    expect(postMock).toHaveBeenNthCalledWith(1, '/api/v1/nps', {
      score: 5,
      opinionText: null,
    });
    expect(postMock).toHaveBeenNthCalledWith(2, '/api/v1/nps', {
      score: 5,
      opinionText: null,
    });
  });
});
