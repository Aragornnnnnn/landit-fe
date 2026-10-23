// useActiveEventPopup — 이번 방문·이 사용자의 응답과 구독 상태가 정해진 뒤에만 공지를 정하고, 정기 구독자에게는 띄우지 않는 계약 검증
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

const subscription = (premium: boolean) =>
  ({
    premium,
    productId: premium ? 'com.saynow.app.premium.monthly' : null,
  }) as MySubscription;

const ME = 1;
const currentUser = vi.hoisted(() => ({ id: 1 as number | null }));
vi.mock('@/shared/auth/current-member', () => ({
  useCurrentUserId: () => currentUser.id,
}));

const POPUP: ActivePopup = {
  popupId: 7,
  imageUrl: 'https://cdn.landit.im/popup/7.webp',
  linkUrl: null,
};

// 캐시에 응답이 남아 있는 상태 — 누구의 응답인지와 언제 받았는지를 고른다
const renderWithCache = (
  cached: ActivePopup | null,
  {
    userId = ME,
    updatedAt = 0,
    skip = false,
  }: { userId?: number; updatedAt?: number; skip?: boolean } = {},
) => {
  const client = new QueryClient();
  client.setQueryData(eventPopupKeys.active(userId), cached, { updatedAt });
  return renderHook(() => useActiveEventPopup({ skip }), {
    wrapper: ({ children }) => (
      <QueryClientProvider client={client}>{children}</QueryClientProvider>
    ),
  });
};

beforeEach(() => {
  localStorage.clear();
  currentUser.id = ME;
  getMySubscriptionMock.mockResolvedValue(subscription(false));
});

describe('useActiveEventPopup', () => {
  it('캐시에 공지가 없었어도 이번 응답이 올 때까지는 기다리는 중으로 본다', async () => {
    getActivePopupMock.mockReturnValue(new Promise(() => {}));

    const { result } = renderWithCache(null);

    // 첫 렌더부터 기다려야 그 사이 시트가 한 프레임이라도 먼저 나서지 않는다
    expect(result.current.loading).toBe(true);
  });

  it('캐시에 남은 공지는 이번 응답이 오기 전엔 띄우지 않는다', async () => {
    getActivePopupMock.mockReturnValue(new Promise(() => {}));

    const { result } = renderWithCache(POPUP);

    await waitFor(() => expect(result.current.loading).toBe(true));
    expect(result.current.popup).toBeNull();
  });

  it('구독하지 않은 사람에게는 서버가 준 공지를 띄운다', async () => {
    getActivePopupMock.mockResolvedValue(POPUP);

    const { result } = renderWithCache(null);

    await waitFor(() => expect(result.current.popup).toEqual(POPUP));
    expect(result.current.loading).toBe(false);
  });

  it('정기 구독 중인 사람에게는 공지를 띄우지 않는다', async () => {
    getActivePopupMock.mockResolvedValue(POPUP);
    getMySubscriptionMock.mockResolvedValue(subscription(true));

    const { result } = renderWithCache(null);

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.popup).toBeNull();
  });

  it('구독 상태를 묻는 동안은 기다리는 중으로 본다', async () => {
    getActivePopupMock.mockResolvedValue(POPUP);
    getMySubscriptionMock.mockReturnValue(new Promise(() => {}));

    const { result } = renderWithCache(null);

    // 공지 응답은 이미 온 뒤다 — 그래도 구독 상태를 모르니 기다린다
    await new Promise((resolve) => setTimeout(resolve, 50));
    expect(result.current.loading).toBe(true);
    expect(result.current.popup).toBeNull();
  });

  it('구독 상태를 알 수 없으면(조회 실패) 공지를 띄우지 않는다', async () => {
    getActivePopupMock.mockResolvedValue(POPUP);
    getMySubscriptionMock.mockRejectedValue(new Error('500'));

    const { result } = renderWithCache(null);

    await waitFor(() => expect(result.current.loading).toBe(false), {
      timeout: 4000,
    });
    expect(result.current.popup).toBeNull();
  });

  it('같은 기기의 다른 계정이 받아 둔 공지는 쓰지 않는다', async () => {
    getActivePopupMock.mockReturnValue(new Promise(() => {}));

    // 다른 계정의 응답이 막 받은 채로 남아 있다
    const { result } = renderWithCache(POPUP, {
      userId: 2,
      updatedAt: Date.now(),
    });

    await waitFor(() => expect(getActivePopupMock).toHaveBeenCalled());
    expect(result.current.popup).toBeNull();
  });

  it('이번 방문을 건너뛰면 공지를 묻지도 기다리지도 않는다', async () => {
    getActivePopupMock.mockResolvedValue(POPUP);

    const { result } = renderWithCache(null, { skip: true });

    await new Promise((resolve) => setTimeout(resolve, 50));
    expect(result.current).toEqual({ popup: null, loading: false });
    expect(getActivePopupMock).not.toHaveBeenCalled();
  });

  it('로그인 정보를 아직 못 읽었으면 묻지 않고 기다리게 하지도 않는다', async () => {
    currentUser.id = null;

    const { result } = renderWithCache(null);

    await new Promise((resolve) => setTimeout(resolve, 50));
    expect(result.current).toEqual({ popup: null, loading: false });
    expect(getActivePopupMock).not.toHaveBeenCalled();
  });
});
