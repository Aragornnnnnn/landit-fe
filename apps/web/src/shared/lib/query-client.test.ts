// 쿼리 캐시 — 객체 URL을 데이터로 쥔 쿼리가 캐시에서 빠지면 그 주소도 해제한다
// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';

import { getQueryClient } from './query-client';

const revoke = vi.fn();

afterEach(() => {
  getQueryClient().clear();
  vi.unstubAllGlobals();
  revoke.mockClear();
});

const addQuery = (key: string, meta?: Record<string, unknown>) => {
  const client = getQueryClient();
  client
    .getQueryCache()
    .build(client, { queryKey: [key], meta })
    .setData(`blob:${key}`);
};

describe('getQueryClient', () => {
  it('객체 URL 쿼리가 캐시에서 빠지면 그 주소를 해제한다', () => {
    vi.stubGlobal('URL', { ...URL, revokeObjectURL: revoke });
    addQuery('photo', { objectUrl: true });

    getQueryClient().removeQueries({ queryKey: ['photo'] });

    expect(revoke).toHaveBeenCalledWith('blob:photo');
  });

  it('다른 쿼리가 빠질 때는 아무것도 해제하지 않는다', () => {
    vi.stubGlobal('URL', { ...URL, revokeObjectURL: revoke });
    addQuery('letter');

    getQueryClient().removeQueries({ queryKey: ['letter'] });

    expect(revoke).not.toHaveBeenCalled();
  });
});
