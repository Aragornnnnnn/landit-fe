// useActiveEventPopup — 지난 방문의 캐시가 남아 있어도 이번 방문의 응답이 올 때까지 공지를 정하지 않는 계약 검증
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import {
  getActivePopup,
  type ActivePopup,
} from '@/features/event-popup/api/event-popup';
import { eventPopupKeys } from '@/features/event-popup/model/useActivePopupQuery';

import { useActiveEventPopup } from './useActiveEventPopup';

vi.mock('@/features/event-popup/api/event-popup', () => ({
  getActivePopup: vi.fn(),
}));
const getActivePopupMock = vi.mocked(getActivePopup);

const POPUP: ActivePopup = {
  popupId: 7,
  imageUrl: 'https://cdn.landit.im/popup/7.webp',
  linkUrl: null,
};

// 지난 방문에 받아 둔 응답이 낡은 채 캐시에 남은 상태
const renderWithStaleCache = (cached: ActivePopup | null) => {
  const client = new QueryClient();
  client.setQueryData(eventPopupKeys.active, cached, { updatedAt: 0 });
  return renderHook(() => useActiveEventPopup(), {
    wrapper: ({ children }) => (
      <QueryClientProvider client={client}>{children}</QueryClientProvider>
    ),
  });
};

beforeEach(() => {
  localStorage.clear();
});

describe('useActiveEventPopup', () => {
  it('캐시에 공지가 없었어도 이번 응답이 올 때까지는 기다리는 중으로 본다', async () => {
    getActivePopupMock.mockReturnValue(new Promise(() => {}));

    const { result } = renderWithStaleCache(null);

    await waitFor(() => expect(result.current.loading).toBe(true));
  });

  it('캐시에 남은 공지는 이번 응답이 오기 전엔 띄우지 않는다', async () => {
    getActivePopupMock.mockReturnValue(new Promise(() => {}));

    const { result } = renderWithStaleCache(POPUP);

    await waitFor(() => expect(result.current.loading).toBe(true));
    expect(result.current.popup).toBeNull();
  });

  it('이번 응답이 오면 그 공지를 띄운다', async () => {
    getActivePopupMock.mockResolvedValue(POPUP);

    const { result } = renderWithStaleCache(null);

    await waitFor(() => expect(result.current.popup).toEqual(POPUP));
    expect(result.current.loading).toBe(false);
  });
});
