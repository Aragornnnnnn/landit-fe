// fetchAllPages — 다음 장이 있는 동안만 이어 받는다
import { describe, expect, it, vi } from 'vitest';

import { fetchAllPages } from './fetch-all-pages';

describe('fetchAllPages', () => {
  it('다음 장이 없으면 한 장만 받는다', async () => {
    const getPage = vi.fn(async () => ({ items: [1], hasNext: false }));

    await expect(fetchAllPages(getPage)).resolves.toEqual([1]);
    expect(getPage).toHaveBeenCalledTimes(1);
  });

  it('다음 장이 있으면 순서대로 받아 이어 붙인다', async () => {
    const getPage = vi.fn(async (page: number) => ({
      items: [page],
      hasNext: page < 2,
    }));

    await expect(fetchAllPages(getPage)).resolves.toEqual([0, 1, 2]);
  });
});
