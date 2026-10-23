// 초대 메시지 보내기 — 코드가 없으면 발급받아 넣고, 복사로 끝나면 알리고, 보내는 동안 다시 눌러도 한 번만 보낸다
import { EVENTS } from '@landit/analytics';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { track } from '@/shared/analytics';
import { shareText } from '@/shared/lib/share-text';
import { showToast } from '@/shared/ui/toast';

import * as referralApi from '../api/referral';
import type { ReferralSummary } from '../api/referral';
import { useInviteShare } from './useInviteShare';

vi.mock('@/shared/analytics', () => ({ track: vi.fn() }));
vi.mock('@/shared/monitoring/report', () => ({ reportWarning: vi.fn() }));
vi.mock('@/shared/ui/toast', () => ({ showToast: vi.fn() }));
vi.mock('@/shared/lib/share-text', () => ({ shareText: vi.fn() }));
vi.mock('@/shared/auth/auth-store', () => ({
  useAuthStore: (selector: (state: unknown) => unknown) =>
    selector({ member: { userId: 42 } }),
}));
vi.mock('../api/referral', () => ({
  getReferralSummary: vi.fn(),
  issueReferralCode: vi.fn(),
}));

const getReferralSummary = vi.mocked(referralApi.getReferralSummary);
const issueReferralCode = vi.mocked(referralApi.issueReferralCode);
const shareTextMock = vi.mocked(shareText);

const offer = {
  code: null,
  policyVersion: 1,
  signup: { enabled: true, target: 'BOTH', inviterWon: 3000, inviteeWon: 3000 },
  purchase: {
    enabled: true,
    target: 'BOTH',
    inviterWon: 5000,
    inviteeWon: 5000,
  },
  purchaseProductNames: [],
} as const;

const summary = (code: string | null): ReferralSummary => ({
  code,
  currentOffer: {
    ...offer,
    signup: { ...offer.signup },
    purchase: { ...offer.purchase },
    purchaseProductNames: [],
  },
  enrolledOffer: null,
  invitedCount: 0,
  convertedCount: 0,
  registrationStatus: 'UNAVAILABLE',
  inviterCreditedWon: 0,
  inviterLimit: { type: 'INVITE_COUNT', value: 10, used: 0, remaining: 10 },
});

const renderShare = async () => {
  const client = new QueryClient();
  const { result } = renderHook(() => useInviteShare(), {
    wrapper: ({ children }) => (
      <QueryClientProvider client={client}>{children}</QueryClientProvider>
    ),
  });
  await waitFor(() => expect(result.current.ready).toBe(true));
  return result;
};

beforeEach(() => {
  getReferralSummary.mockResolvedValue(summary('K7QM3XPA'));
  shareTextMock.mockResolvedValue('native_sheet');
});

describe('useInviteShare', () => {
  it('코드가 든 초대 메시지를 보내고 쓴 길을 계측한다', async () => {
    const result = await renderShare();

    await act(() => result.current.share());

    expect(shareTextMock.mock.calls[0][0]).toContain('초대 코드: K7QM3XPA');
    expect(track).toHaveBeenCalledWith(EVENTS.REFERRAL_INVITE_SHARED, {
      method: 'native_sheet',
    });
  });

  it('아직 코드가 없으면 발급받아 넣는다', async () => {
    getReferralSummary.mockResolvedValue(summary(null));
    issueReferralCode.mockResolvedValue('R4TN8WKE');
    const result = await renderShare();

    await act(() => result.current.share());

    expect(shareTextMock.mock.calls[0][0]).toContain('초대 코드: R4TN8WKE');
  });

  it('코드를 받기 전에는 보낼 준비가 되지 않는다 — 탭한 뒤 발급을 기다리면 공유 권한이 사라진다', async () => {
    getReferralSummary.mockResolvedValue(summary(null));
    issueReferralCode.mockReturnValue(new Promise(() => {}));
    const client = new QueryClient();

    const { result } = renderHook(() => useInviteShare(), {
      wrapper: ({ children }) => (
        <QueryClientProvider client={client}>{children}</QueryClientProvider>
      ),
    });

    await waitFor(() => expect(getReferralSummary).toHaveBeenCalled());
    expect(result.current.ready).toBe(false);
  });

  it('복사로 끝나면 복사했다고 알린다', async () => {
    shareTextMock.mockResolvedValue('copy');
    const result = await renderShare();

    await act(() => result.current.share());

    expect(showToast).toHaveBeenCalledWith('초대 메시지를 복사했어요');
  });

  it('보내는 중에 또 눌러도 한 번만 보낸다', async () => {
    let finish: (method: 'web_share') => void = () => {};
    shareTextMock.mockReturnValue(new Promise((resolve) => (finish = resolve)));
    const result = await renderShare();

    await act(async () => {
      const first = result.current.share();
      void result.current.share();
      finish('web_share');
      await first;
    });

    expect(shareTextMock).toHaveBeenCalledTimes(1);
  });
});
