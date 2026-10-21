// 온보딩 초대 코드 단계 — 붙여넣으면 확인까지 저절로, 등록·건너뛰기는 서버에 남기고 다음으로 넘어가는 계약
import { EVENTS } from '@landit/analytics';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import * as referralApi from '@/features/referral/api/referral';
import type { ReferralPreview } from '@/features/referral/api/referral';
import { track } from '@/shared/analytics';
import { ApiError } from '@/shared/api/api-error';
import { showToast } from '@/shared/ui/toast';

import { ReferralStep } from './ReferralStep';

vi.mock('@/shared/analytics', () => ({ track: vi.fn() }));
vi.mock('@/shared/monitoring/report', () => ({ reportWarning: vi.fn() }));
vi.mock('@/shared/ui/toast', () => ({ showToast: vi.fn() }));
vi.mock('@/shared/auth/auth-store', () => ({
  useAuthStore: (selector: (state: unknown) => unknown) =>
    selector({ member: { userId: 42 } }),
}));
vi.mock('@/features/referral/api/referral', () => ({
  previewReferralCode: vi.fn(),
  registerReferralCode: vi.fn(),
  skipReferralRegistration: vi.fn(),
}));

const previewReferralCode = vi.mocked(referralApi.previewReferralCode);
const registerReferralCode = vi.mocked(referralApi.registerReferralCode);
const skipReferralRegistration = vi.mocked(
  referralApi.skipReferralRegistration,
);

const preview = (over: Partial<ReferralPreview> = {}): ReferralPreview => ({
  code: 'K7QM3XPA',
  policyVersion: 3,
  signup: { enabled: true, target: 'BOTH', inviterWon: 3000, inviteeWon: 3000 },
  purchase: {
    enabled: true,
    target: 'BOTH',
    inviterWon: 5000,
    inviteeWon: 5000,
  },
  purchaseProductNames: [],
  ...over,
});

const renderStep = () => {
  const onDone = vi.fn();
  render(
    <QueryClientProvider client={new QueryClient()}>
      <ReferralStep signupWon={3000} onDone={onDone} />
    </QueryClientProvider>,
  );
  return { onDone, input: screen.getByLabelText('초대 코드') };
};

const pasteMessage = (input: HTMLElement, text: string) =>
  fireEvent.paste(input, { clipboardData: { getData: () => text } });

beforeEach(() => {
  previewReferralCode.mockResolvedValue(preview());
  registerReferralCode.mockResolvedValue(null);
  skipReferralRegistration.mockResolvedValue(null);
});

afterEach(() => {
  cleanup();
});

describe('ReferralStep', () => {
  it('메시지를 붙여넣으면 코드를 확인해 받을 금액을 보여 준다', async () => {
    const { input } = renderStep();

    pasteMessage(input, '같이 해요\n초대 코드: K7QM3XPA');

    expect(
      await screen.findByText('✓ 확인됐어요 · 지금 등록하면 3,000원'),
    ).toBeInTheDocument();
    expect(previewReferralCode).toHaveBeenCalledWith('K7QM3XPA');
  });

  it('확인된 코드를 등록하면 확인한 정책 버전을 같이 보내고 다음으로 넘어간다', async () => {
    const { input, onDone } = renderStep();
    pasteMessage(input, 'K7QM3XPA');
    await screen.findByText('✓ 확인됐어요 · 지금 등록하면 3,000원');

    fireEvent.click(
      screen.getByRole('button', { name: '등록하고 계속할게요' }),
    );

    await waitFor(() => expect(onDone).toHaveBeenCalled());
    expect(registerReferralCode).toHaveBeenCalledWith({
      code: 'K7QM3XPA',
      policyVersion: 3,
    });
    expect(track).toHaveBeenCalledWith(EVENTS.REFERRAL_CODE_REGISTERED, {
      method: 'paste',
    });
  });

  it('붙여넣은 글에 코드가 없으면 못 찾았다고 알린다', () => {
    const { input } = renderStep();

    pasteMessage(input, '안녕하세요');

    expect(
      screen.getByText('복사한 내용에서 초대 코드를 못 찾았어요'),
    ).toBeInTheDocument();
  });

  it('잘못된 코드면 칸 아래에 다시 확인하라고 알리고 등록 버튼은 꺼 둔다', async () => {
    previewReferralCode.mockRejectedValue(
      new ApiError(
        'x',
        400,
        '/api/v1/referrals/preview',
        'REFERRAL_CODE_INVALID',
      ),
    );
    const { input } = renderStep();

    fireEvent.change(input, { target: { value: 'K7QM3XPB' } });

    expect(
      await screen.findByText('코드를 다시 확인해 주세요'),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: '등록하고 계속할게요' }),
    ).toBeDisabled();
  });

  it('이미 등록된 사람이면 오류 없이 다음으로 넘어간다', async () => {
    registerReferralCode.mockRejectedValue(
      new ApiError(
        'x',
        409,
        '/api/v1/referrals/registration',
        'REFERRAL_ALREADY_REGISTERED',
      ),
    );
    const { input, onDone } = renderStep();
    pasteMessage(input, 'K7QM3XPA');
    await screen.findByText('✓ 확인됐어요 · 지금 등록하면 3,000원');

    fireEvent.click(
      screen.getByRole('button', { name: '등록하고 계속할게요' }),
    );

    await waitFor(() => expect(onDone).toHaveBeenCalled());
  });

  it('등록할 수 없게 됐으면 한 줄 알리고 다음으로 넘어간다', async () => {
    registerReferralCode.mockRejectedValue(
      new ApiError(
        'x',
        409,
        '/api/v1/referrals/registration',
        'REFERRAL_REGISTRATION_CLOSED',
      ),
    );
    const { input, onDone } = renderStep();
    pasteMessage(input, 'K7QM3XPA');
    await screen.findByText('✓ 확인됐어요 · 지금 등록하면 3,000원');

    fireEvent.click(
      screen.getByRole('button', { name: '등록하고 계속할게요' }),
    );

    await waitFor(() => expect(onDone).toHaveBeenCalled());
    expect(showToast).toHaveBeenCalledWith(
      '지금은 초대 코드를 등록할 수 없어요',
    );
  });

  it('등록이 거절되면 확인 표시를 걷고 이유를 알리며 같은 코드로는 다시 못 누른다', async () => {
    registerReferralCode.mockRejectedValue(
      new ApiError(
        'x',
        400,
        '/api/v1/referrals/registration',
        'REFERRAL_SELF_INVITE',
      ),
    );
    const { input } = renderStep();
    pasteMessage(input, 'K7QM3XPA');
    await screen.findByText('✓ 확인됐어요 · 지금 등록하면 3,000원');

    fireEvent.click(
      screen.getByRole('button', { name: '등록하고 계속할게요' }),
    );

    expect(
      await screen.findByText('내 초대 코드는 넣을 수 없어요'),
    ).toBeInTheDocument();
    expect(
      screen.queryByText('✓ 확인됐어요 · 지금 등록하면 3,000원'),
    ).not.toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: '등록하고 계속할게요' }),
    ).toBeDisabled();
  });

  it('「초대 코드가 없어요」를 누르면 건너뛰기를 서버에 남기고 다음으로 넘어간다', async () => {
    const { onDone } = renderStep();

    fireEvent.click(screen.getByRole('button', { name: '초대 코드가 없어요' }));

    await waitFor(() => expect(onDone).toHaveBeenCalled());
    expect(skipReferralRegistration).toHaveBeenCalled();
    expect(track).toHaveBeenCalledWith(EVENTS.REFERRAL_CODE_SKIPPED);
  });
});
