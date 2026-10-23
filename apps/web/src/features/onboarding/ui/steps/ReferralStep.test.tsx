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
import { haptic } from '@/shared/haptics';
import { showToast } from '@/shared/ui/toast';

import { ReferralStep, type ReferralPhase } from './ReferralStep';

vi.mock('@/shared/analytics', () => ({ track: vi.fn() }));
vi.mock('@/shared/monitoring/report', () => ({ reportWarning: vi.fn() }));
vi.mock('@/shared/ui/toast', () => ({ showToast: vi.fn() }));
vi.mock('@/shared/haptics', () => ({ haptic: vi.fn() }));
vi.mock('next/image', () => ({ default: () => <span /> }));
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

const renderStep = (phase: ReferralPhase = 'enter') => {
  const onDone = vi.fn();
  const onEnter = vi.fn();
  render(
    <QueryClientProvider client={new QueryClient()}>
      <ReferralStep
        phase={phase}
        onEnter={onEnter}
        signupWon={3000}
        onDone={onDone}
      />
    </QueryClientProvider>,
  );
  return { onDone, onEnter, input: screen.queryByLabelText('초대 코드')! };
};

const pasteMessage = (input: HTMLElement, text: string) =>
  fireEvent.paste(input, { clipboardData: { getData: () => text } });

beforeEach(() => {
  // 앞 테스트가 걸어 둔 한 번짜리 응답(mock…Once)이 남지 않게 매번 처음부터 다시 건다
  vi.resetAllMocks();
  previewReferralCode.mockResolvedValue(preview());
  registerReferralCode.mockResolvedValue(null);
  skipReferralRegistration.mockResolvedValue(null);
});

afterEach(() => {
  cleanup();
});

describe('ReferralStep · 초대 받았는지 묻기', () => {
  it('처음에는 돈 이야기 없이 초대 받고 왔는지만 묻는다', () => {
    renderStep('ask');

    expect(screen.getByText(/친구에게 초대 받고/)).toBeInTheDocument();
    expect(screen.queryByText(/원/)).not.toBeInTheDocument();
    expect(screen.queryByLabelText('초대 코드')).not.toBeInTheDocument();
  });

  it('「네, 초대 코드가 있어요」를 누르면 코드 입력으로 넘어간다', () => {
    const { onEnter, onDone } = renderStep('ask');

    fireEvent.click(
      screen.getByRole('button', { name: '네, 초대 코드가 있어요' }),
    );

    expect(onEnter).toHaveBeenCalled();
    expect(onDone).not.toHaveBeenCalled();
  });

  it('「아니요」를 누르면 건너뛰기를 서버에 남기고 다음으로 넘어간다', async () => {
    const { onDone } = renderStep('ask');

    fireEvent.click(screen.getByRole('button', { name: '아니요' }));

    await waitFor(() => expect(onDone).toHaveBeenCalled());
    expect(skipReferralRegistration).toHaveBeenCalled();
    expect(track).toHaveBeenCalledWith(EVENTS.REFERRAL_CODE_SKIPPED, {
      from: 'ask',
    });
  });
});

describe('ReferralStep · 건너뛰기 한 번만', () => {
  it('「아니요」를 두 번 눌러도 건너뛰기는 한 번만 보낸다', async () => {
    renderStep('ask');

    fireEvent.click(screen.getByRole('button', { name: '아니요' }));
    fireEvent.click(screen.getByRole('button', { name: '아니요' }));

    await waitFor(() => expect(skipReferralRegistration).toHaveBeenCalled());
    expect(skipReferralRegistration).toHaveBeenCalledTimes(1);
  });
});

describe('ReferralStep · 코드 입력', () => {
  it('메시지를 붙여넣으면 확인하고 확인한 정책 버전으로 저절로 등록한다', async () => {
    const { input } = renderStep();

    pasteMessage(input, '같이 해요\n초대 코드: K7QM3XPA');

    expect(await screen.findByText('확인됐어요')).toBeInTheDocument();
    await waitFor(() =>
      expect(registerReferralCode).toHaveBeenCalledWith({
        code: 'K7QM3XPA',
        policyVersion: 3,
      }),
    );
    expect(previewReferralCode).toHaveBeenCalledWith('K7QM3XPA');
    expect(track).toHaveBeenCalledWith(EVENTS.REFERRAL_CODE_REGISTERED, {
      method: 'paste',
    });
  });

  it('등록되면 성공 진동과 함께 확인한 조건의 적립 금액을 띄우고 잠시 뒤 저절로 다음으로 넘어간다', async () => {
    previewReferralCode.mockResolvedValue(
      preview({
        signup: {
          enabled: true,
          target: 'BOTH',
          inviterWon: 1000,
          inviteeWon: 3000,
        },
      }),
    );
    const { input, onDone } = renderStep();

    pasteMessage(input, 'K7QM3XPA');

    expect(await screen.findByText('+3,000원')).toBeInTheDocument();
    expect(screen.getByText('초대 코드로 적립됐어요')).toBeInTheDocument();
    expect(haptic).toHaveBeenCalledWith('success');
    expect(onDone).not.toHaveBeenCalled();
    await waitFor(() => expect(onDone).toHaveBeenCalled(), { timeout: 5000 });
  });

  it('받을 금액이 없는 조건이면 금액 없이 등록됐다고만 알린다', async () => {
    previewReferralCode.mockResolvedValue(
      preview({
        signup: {
          enabled: false,
          target: 'NONE',
          inviterWon: 0,
          inviteeWon: 0,
        },
      }),
    );
    const { input } = renderStep();

    pasteMessage(input, 'K7QM3XPA');

    expect(
      await screen.findByText('초대 코드가 등록됐어요'),
    ).toBeInTheDocument();
    expect(screen.queryByText(/^\+/)).not.toBeInTheDocument();
  });

  it('확인하는 동안에는 확인 중이라고 알린다', async () => {
    previewReferralCode.mockReturnValue(new Promise(() => {}));
    const { input } = renderStep();

    fireEvent.change(input, { target: { value: 'K7QM3XPA' } });

    expect(await screen.findByText('확인하고 있어요')).toBeInTheDocument();
    expect(registerReferralCode).not.toHaveBeenCalled();
  });

  it('「네」를 고른 뒤라 코드가 있는지 다시 묻지 않고 넣어 달라고 한다', () => {
    renderStep();

    expect(
      screen.getByRole('heading', { name: /초대 코드를 넣어 주세요/ }),
    ).toBeInTheDocument();
  });

  it('등록하면 받을 금액을 제목 아래에 알린다', () => {
    renderStep();

    expect(
      screen.getByText('등록하면 3,000원을 적립해 드려요'),
    ).toBeInTheDocument();
  });

  it('등록이 바로 끝나도 확인됨을 먼저 보여 주고 잠시 뒤에 적립 연출을 띄운다', async () => {
    const { input } = renderStep();

    pasteMessage(input, 'K7QM3XPA');

    await waitFor(() => expect(registerReferralCode).toHaveBeenCalled());
    expect(screen.getByText('확인됐어요')).toBeInTheDocument();
    expect(screen.queryByText('+3,000원')).not.toBeInTheDocument();
    expect(await screen.findByText('+3,000원')).toBeInTheDocument();
  });

  it('붙여넣기 버튼으로 클립보드의 메시지를 읽어 코드를 넣는다', async () => {
    Object.assign(navigator, {
      clipboard: { readText: vi.fn().mockResolvedValue('초대 코드: K7QM3XPA') },
    });
    renderStep();

    fireEvent.click(screen.getByRole('button', { name: '붙여넣기' }));

    await waitFor(() =>
      expect(previewReferralCode).toHaveBeenCalledWith('K7QM3XPA'),
    );
  });

  it('코드 입력 화면에는 누를 등록 버튼을 두지 않는다', () => {
    renderStep();

    expect(
      screen.queryByRole('button', { name: '등록하고 계속할게요' }),
    ).not.toBeInTheDocument();
  });

  it('붙여넣은 글에 코드가 없으면 못 찾았다고 알린다', () => {
    const { input } = renderStep();

    pasteMessage(input, '안녕하세요');

    expect(
      screen.getByText('복사한 내용에서 초대 코드를 못 찾았어요'),
    ).toBeInTheDocument();
  });

  it('잘못된 코드면 칸 아래에 다시 확인하라고 알리고 등록하지 않는다', async () => {
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
    expect(registerReferralCode).not.toHaveBeenCalled();
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

    await waitFor(() => expect(onDone).toHaveBeenCalled());
    expect(showToast).toHaveBeenCalledWith(
      '지금은 초대 코드를 등록할 수 없어요',
    );
  });

  it('등록이 거절되면 확인 표시를 걷고 이유를 알리며 같은 코드로 다시 보내지 않는다', async () => {
    registerReferralCode.mockRejectedValue(
      new ApiError(
        'x',
        400,
        '/api/v1/referrals/registration',
        'REFERRAL_SELF_INVITE',
      ),
    );
    const { input, onDone } = renderStep();

    pasteMessage(input, 'K7QM3XPA');

    expect(
      await screen.findByText('내 초대 코드는 넣을 수 없어요'),
    ).toBeInTheDocument();
    expect(screen.queryByText('확인됐어요')).not.toBeInTheDocument();
    expect(registerReferralCode).toHaveBeenCalledTimes(1);
    expect(onDone).not.toHaveBeenCalled();
  });

  it('보상 조건이 바뀌었으면 새 조건을 받아 그 버전으로 다시 등록한다', async () => {
    registerReferralCode
      .mockRejectedValueOnce(
        new ApiError(
          'x',
          409,
          '/api/v1/referrals/registration',
          'REFERRAL_POLICY_CHANGED',
        ),
      )
      .mockResolvedValue(null);
    previewReferralCode
      .mockResolvedValueOnce(preview())
      .mockResolvedValue(preview({ policyVersion: 4 }));
    const { input } = renderStep();

    pasteMessage(input, 'K7QM3XPA');

    await waitFor(() =>
      expect(registerReferralCode).toHaveBeenLastCalledWith({
        code: 'K7QM3XPA',
        policyVersion: 4,
      }),
    );
  });

  it('「초대 코드가 없어요」를 누르면 바로 건너뛰지 않고 코드 모양을 보여 주며 한 번 더 묻는다', () => {
    const { onDone } = renderStep();

    fireEvent.click(screen.getByRole('button', { name: '초대 코드가 없어요' }));

    expect(
      screen.getByText('친구에게 받은 메시지를 확인해 보세요'),
    ).toBeInTheDocument();
    expect(screen.getByText(/초대 코드: K7QM3XPA/)).toBeInTheDocument();
    expect(skipReferralRegistration).not.toHaveBeenCalled();
    expect(onDone).not.toHaveBeenCalled();
  });

  it('확인 시트에서 「코드 없이 계속할게요」를 누르면 건너뛰기를 서버에 남기고 다음으로 넘어간다', async () => {
    const { onDone } = renderStep();
    fireEvent.click(screen.getByRole('button', { name: '초대 코드가 없어요' }));

    fireEvent.click(
      screen.getByRole('button', { name: '코드 없이 계속할게요' }),
    );

    await waitFor(() => expect(onDone).toHaveBeenCalled());
    expect(skipReferralRegistration).toHaveBeenCalled();
    expect(track).toHaveBeenCalledWith(EVENTS.REFERRAL_CODE_SKIPPED, {
      from: 'entry',
    });
  });

  it('확인 시트에서 「코드 찾아볼게요」를 누르면 건너뛰지 않고 코드 입력에 남는다', async () => {
    const { onDone } = renderStep();
    fireEvent.click(screen.getByRole('button', { name: '초대 코드가 없어요' }));

    fireEvent.click(screen.getByRole('button', { name: '코드 찾아볼게요' }));

    await waitFor(() =>
      expect(
        screen.queryByText('친구에게 받은 메시지를 확인해 보세요'),
      ).not.toBeInTheDocument(),
    );
    expect(skipReferralRegistration).not.toHaveBeenCalled();
    expect(onDone).not.toHaveBeenCalled();
  });
});

describe('ReferralStep · 거절·재시도', () => {
  const selfInvite = () =>
    new ApiError(
      'x',
      400,
      '/api/v1/referrals/registration',
      'REFERRAL_SELF_INVITE',
    );

  it('거절된 코드를 다시 넣으면 확인됐다고 하지 않고 거절 이유를 그대로 보이며 다시 보내지 않는다', async () => {
    registerReferralCode.mockRejectedValue(selfInvite());
    const { input } = renderStep();
    pasteMessage(input, 'K7QM3XPA');
    await screen.findByText('내 초대 코드는 넣을 수 없어요');

    pasteMessage(input, 'K7QM3XPA');

    expect(
      await screen.findByText('내 초대 코드는 넣을 수 없어요'),
    ).toBeInTheDocument();
    expect(screen.queryByText('확인됐어요')).not.toBeInTheDocument();
    expect(registerReferralCode).toHaveBeenCalledTimes(1);
  });

  it('네트워크로 실패했으면 같은 코드를 다시 넣을 때 다시 보낸다', async () => {
    registerReferralCode
      .mockRejectedValueOnce(new Error('network'))
      .mockResolvedValue(null);
    const { input } = renderStep();
    pasteMessage(input, 'K7QM3XPA');
    await screen.findByText('확인하지 못했어요. 다시 시도해 주세요');

    pasteMessage(input, 'K7QM3XPA');

    await waitFor(() => expect(registerReferralCode).toHaveBeenCalledTimes(2));
  });

  it('조건이 또 바뀌었다고 하면 한 번만 다시 보내고 멈춰 다시 확인하라고 알린다', async () => {
    registerReferralCode.mockRejectedValue(
      new ApiError(
        'x',
        409,
        '/api/v1/referrals/registration',
        'REFERRAL_POLICY_CHANGED',
      ),
    );
    const { input } = renderStep();

    pasteMessage(input, 'K7QM3XPA');

    await waitFor(() => expect(registerReferralCode).toHaveBeenCalledTimes(2));
    expect(
      await screen.findByText('보상 조건이 바뀌었어요. 다시 확인해 주세요'),
    ).toBeInTheDocument();
    await new Promise((resolve) => setTimeout(resolve, 50));
    expect(registerReferralCode).toHaveBeenCalledTimes(2);
  });

  it('건너뛸지 묻는 동안 확인이 끝나도 등록을 보내지 않고, 건너뛰면 등록 없이 넘어간다', async () => {
    let resolvePreview: (value: ReferralPreview) => void = () => {};
    previewReferralCode.mockReturnValue(
      new Promise((resolve) => {
        resolvePreview = resolve;
      }),
    );
    const { input, onDone } = renderStep();
    fireEvent.change(input, { target: { value: 'K7QM3XPA' } });
    fireEvent.click(screen.getByRole('button', { name: '초대 코드가 없어요' }));

    resolvePreview(preview());
    await screen.findByText('확인됐어요');
    fireEvent.click(
      screen.getByRole('button', { name: '코드 없이 계속할게요' }),
    );

    await waitFor(() => expect(onDone).toHaveBeenCalled());
    expect(registerReferralCode).not.toHaveBeenCalled();
    expect(skipReferralRegistration).toHaveBeenCalled();
  });
});
