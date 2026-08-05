// 달력 조회 URL 계약 — 달을 지정하지 않으면 파라미터 없이 보내 서버가 오늘의 달을 고르게 한다
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { api } from '@/shared/api/client';

import { getStreakCalendar } from './streak';

vi.mock('@/shared/api/client', () => ({
  api: { get: vi.fn() },
}));

const get = vi.mocked(api.get);

beforeEach(() => {
  get.mockReset();
  get.mockResolvedValue({} as never);
});

describe('getStreakCalendar', () => {
  it('달을 주지 않으면 파라미터 없이 요청한다', async () => {
    // when — 첫 조회는 어느 달인지 모르는 채로 나간다
    await getStreakCalendar(null);

    // then — 서버가 KST 오늘이 든 달을 고른다
    expect(get).toHaveBeenCalledWith('/api/v1/me/streak/calendar');
  });

  it('달을 주면 연·월을 붙인다', async () => {
    // when — 월 이동은 지금까지처럼 지정해서 부른다
    await getStreakCalendar({ year: 2026, month: 7 });

    // then
    expect(get).toHaveBeenCalledWith(
      '/api/v1/me/streak/calendar?year=2026&month=7',
    );
  });
});
