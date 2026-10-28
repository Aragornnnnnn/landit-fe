// 앱 버전 정책 조회 — 화면 언어가 바뀌면 그 언어의 업데이트 사유를 새로 받는지 검증한다
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { setTestLocale } from '@/shared/i18n/test-locale';

import { checkAppUpdate } from '../api/app-update';
import { useAppUpdateQuery } from './useAppUpdateQuery';

vi.mock('../api/app-update', () => ({ checkAppUpdate: vi.fn() }));
const checkMock = vi.mocked(checkAppUpdate);

const request = { platform: 'IOS', versionName: '1.5.0' } as const;

describe('useAppUpdateQuery', () => {
  it('화면 언어가 바뀌면 이전 언어로 받은 사유를 쓰지 않고 다시 묻는다', async () => {
    checkMock.mockResolvedValue({ reason: '업데이트해 주세요' } as never);
    const client = new QueryClient();
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <QueryClientProvider client={client}>{children}</QueryClientProvider>
    );
    const { rerender } = renderHook(() => useAppUpdateQuery(request), {
      wrapper,
    });
    await waitFor(() => expect(checkMock).toHaveBeenCalledTimes(1));

    setTestLocale('ja');
    rerender();

    await waitFor(() => expect(checkMock).toHaveBeenCalledTimes(2));
  });
});
