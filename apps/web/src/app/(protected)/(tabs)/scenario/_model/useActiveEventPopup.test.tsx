// useActiveEventPopup — 이번 방문의 응답과 구독 상태가 정해진 뒤에만 공지를 띄우고, 정기 구독자에게는 띄우지 않는 계약 검증
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import {
  getActivePopup,
  type ActivePopup,
} from '@/features/event-popup/api/event-popup';
import { eventPopupKeys } from '@/features/event-popup/model/useActivePopupQuery';
import {
  getMySubscription,
  type MySubscription,
} from '@/features/subscription/api/subscription';

import { useActiveEventPopup } from './useActiveEventPopup';

vi.mock('@/features/event-popup/api/event-popup', () => ({
  getActivePopup: vi.fn(),
}));
const getActivePopupMock = vi.mocked(getActivePopup);

vi.mock('@/features/subscription/api/subscription', () => ({
  getMySubscription: vi.fn(),
}));
const getMySubscriptionMock = vi.mocked(getMySubscription);

vi.mock('@/shared/auth/current-member', () => ({
  useCurrentUserId: () => 1,
}));

const POPUP: ActivePopup = {
  popupId: 7,
  imageUrl: 'https://cdn.landit.im/popup/7.webp',
  linkUrl: null,
};

const subscription = (premium: boolean) =>
  ({
    premium,
    productId: premium ? 'com.saynow.app.premium.monthly' : null,
  }) as MySubscription;

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
  getMySubscriptionMock.mockResolvedValue(subscription(false));
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

  it('구독하지 않은 사람에게는 이번 응답의 공지를 띄운다', async () => {
    getActivePopupMock.mockResolvedValue(POPUP);

    const { result } = renderWithStaleCache(null);

    await waitFor(() => expect(result.current.popup).toEqual(POPUP));
    expect(result.current.loading).toBe(false);
  });

  it('정기 구독 중인 사람에게는 공지를 띄우지 않는다', async () => {
    getActivePopupMock.mockResolvedValue(POPUP);
    getMySubscriptionMock.mockResolvedValue(subscription(true));

    const { result } = renderWithStaleCache(null);

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.popup).toBeNull();
  });

  it('구독 상태를 묻는 동안은 기다리는 중으로 본다', async () => {
    getActivePopupMock.mockResolvedValue(POPUP);
    getMySubscriptionMock.mockReturnValue(new Promise(() => {}));

    const { result } = renderWithStaleCache(null);

    // 공지 응답은 이미 온 뒤다 — 그래도 구독 상태를 모르니 기다린다
    await new Promise((resolve) => setTimeout(resolve, 50));
    expect(result.current.loading).toBe(true);
    expect(result.current.popup).toBeNull();
  });

  it('구독 상태를 알 수 없으면(조회 실패) 공지를 띄우지 않는다', async () => {
    getActivePopupMock.mockResolvedValue(POPUP);
    getMySubscriptionMock.mockRejectedValue(new Error('500'));

    const { result } = renderWithStaleCache(null);

    await waitFor(() => expect(result.current.loading).toBe(false), {
      timeout: 4000,
    });
    expect(result.current.popup).toBeNull();
  });
});
