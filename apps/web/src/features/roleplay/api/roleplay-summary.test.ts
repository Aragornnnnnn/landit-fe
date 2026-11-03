// 요약 조회 — 통계를 먼저 받도록 progressive로 묻는지 검증 (스몰톡·롤플레이 같은 계약)
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { getSmallTalkSummary } from '@/features/small-talk/api/small-talk';
import { api } from '@/shared/api/client';

import { getRoleplaySummary } from './roleplay';

vi.mock('@/shared/api/client', () => ({ api: { get: vi.fn() } }));

beforeEach(() => {
  vi.mocked(api.get).mockReset();
});

describe('요약 조회', () => {
  it('롤플레이 요약은 통계를 먼저 달라고 묻는다', () => {
    void getRoleplaySummary(7);

    expect(api.get).toHaveBeenCalledWith(
      '/api/v1/roleplays/sessions/7/summary?progressive=true',
    );
  });

  it('스몰톡 요약은 통계를 먼저 달라고 묻는다', () => {
    void getSmallTalkSummary(7);

    expect(api.get).toHaveBeenCalledWith(
      '/api/v1/free-talk/sessions/7/summary?progressive=true',
    );
  });
});
