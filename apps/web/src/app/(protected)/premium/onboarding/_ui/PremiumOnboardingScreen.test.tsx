// 프리미엄 온보딩 — 환영 뒤 (환급 상품이면 환급 안내를 거쳐) 알람 등록으로 이어지는지, 어느 길로 끝나든 원래 가던 곳으로 replace하는지
import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  endedRewardView,
  rewardCycle,
  rewardView,
} from '@/features/reward/model/reward.fixture';
import { useAuthStore } from '@/shared/auth/auth-store';

import { PremiumOnboardingScreen } from './PremiumOnboardingScreen';

const mocks = vi.hoisted(() => ({
  replace: vi.fn(),
  alarmShell: true,
  status: null as { supported: boolean } | null,
  setting: undefined as { time: string; enabled: boolean } | undefined,
  invalidateQueries: vi.fn(),
  refetch: vi.fn(),
  reward: null as unknown,
  launched: false,
  refreshReward: vi.fn(),
  fetchLatest: vi.fn(),
}));

vi.mock('@tanstack/react-query', () => ({
  useQueryClient: () => ({ invalidateQueries: mocks.invalidateQueries }),
}));

// 환급 조회는 다른 기능의 일이라 목으로 둔다 — 여기서는 무엇을 받았을 때 어느 길로 가는지만 본다
vi.mock('@/features/reward/model/refresh-reward', () => ({
  refreshRewardAfterPurchase: mocks.refreshReward,
  fetchLatestReward: mocks.fetchLatest,
}));
vi.mock('@/features/subscription/model/paywall-gate/payment-flag', () => ({
  get REFUND_CHALLENGE_ENABLED() {
    return mocks.launched;
  },
}));
// 규칙 화면의 돈통 그림 — 이미지 최적화 부품은 jsdom에서 돌지 않는다
vi.mock('next/image', () => ({ default: () => <span /> }));
vi.mock('@/features/reward/ui/RefundGuide', async (importOriginal) => ({
  ...(await importOriginal<
    typeof import('@/features/reward/ui/RefundGuide')
  >()),
  preloadRefundGuide: vi.fn(),
}));
vi.mock('next/navigation', () => ({
  useRouter: () => ({ replace: mocks.replace }),
}));
vi.mock('@/shared/lib/last-tab', () => ({ homePath: () => '/scenario' }));
vi.mock('@/features/alarm/model/shell-alarm', () => ({
  isAlarmShell: () => mocks.alarmShell,
}));
vi.mock('@/features/alarm/model/useAlarmStatus', () => ({
  useAlarmStatus: () => mocks.status,
}));
vi.mock('@/features/alarm/model/useAlarmSettingQuery', () => ({
  useAlarmSettingQuery: () => ({ data: mocks.setting, refetch: mocks.refetch }),
}));
vi.mock('@/features/alarm/ui/LockScreenPreview', () => ({
  preloadIntroPreview: vi.fn(),
}));
// 환영 연출과 등록 흐름은 갈 길만 보이는 버튼으로 바꾼다 — 여기선 넘어가는 길만 본다
vi.mock('./PremiumWelcome', () => ({
  PremiumWelcome: ({
    onNext,
    pending,
  }: {
    onNext: () => void;
    pending?: boolean;
  }) => (
    <button type="button" onClick={onNext} disabled={pending}>
      다음
    </button>
  ),
}));
vi.mock('@/features/alarm/ui/AlarmSetupFlow', () => ({
  AlarmSetupFlow: ({
    onSkip,
    onDone,
    refund,
  }: {
    onSkip: () => void;
    onDone: () => void;
    refund: boolean;
  }) => (
    <>
      <p>{refund ? '환급 문구' : '기본 문구'}</p>
      <button type="button" onClick={onSkip}>
        다음에 할게요
      </button>
      <button type="button" onClick={onDone}>
        등록 끝
      </button>
    </>
  ),
}));

beforeEach(() => {
  mocks.replace.mockClear();
  mocks.alarmShell = true;
  mocks.status = { supported: true };
  mocks.setting = { time: '19:00', enabled: false };
  mocks.invalidateQueries.mockClear();
  mocks.refetch.mockReset();
  mocks.reward = null;
  mocks.launched = false;
  mocks.refreshReward.mockClear();
  mocks.fetchLatest.mockReset();
  mocks.fetchLatest.mockImplementation(() => Promise.resolve(mocks.reward));
});
afterEach(() => {
  cleanup();
  useAuthStore.getState().clearAuth();
});

const signIn = (role: 'USER' | 'ADMIN') =>
  useAuthStore.getState().setAuth('access', 'refresh', {
    userId: 1,
    nickname: '준서',
    email: null,
    provider: 'kakao',
    role,
  });

// 3개월 환급 상품을 막 산 사람의 환급
const bought = () =>
  rewardView({
    current: rewardCycle({ maximumWon: 31920, balanceWon: 0 }),
    remainingDays: 92,
  });

describe('PremiumOnboardingScreen', () => {
  it('알람을 쓸 수 있는 셸이면 「다음」 뒤 알람 등록으로 이어진다', () => {
    render(<PremiumOnboardingScreen returnTo="/me" />);

    fireEvent.click(screen.getByRole('button', { name: '다음' }));

    expect(screen.getByRole('button', { name: '다음에 할게요' })).toBeVisible();
    expect(mocks.replace).not.toHaveBeenCalled();
  });

  it('알람 등록을 마치면 원래 가던 곳으로 간다', () => {
    render(<PremiumOnboardingScreen returnTo="/expressions/scenario/3/12" />);
    fireEvent.click(screen.getByRole('button', { name: '다음' }));

    fireEvent.click(screen.getByRole('button', { name: '등록 끝' }));

    expect(mocks.replace).toHaveBeenCalledWith('/expressions/scenario/3/12');
  });

  it('「다음에 할게요」를 누르면 원래 가던 곳으로 간다', () => {
    render(<PremiumOnboardingScreen returnTo="/expressions/scenario/3/12" />);
    fireEvent.click(screen.getByRole('button', { name: '다음' }));

    fireEvent.click(screen.getByRole('button', { name: '다음에 할게요' }));

    expect(mocks.replace).toHaveBeenCalledWith('/expressions/scenario/3/12');
  });

  it('알람을 모르는 셸(브라우저·구 셸)이면 환영만 보고 원래 가던 곳으로 간다', () => {
    mocks.alarmShell = false;
    render(<PremiumOnboardingScreen returnTo="/me" />);

    fireEvent.click(screen.getByRole('button', { name: '다음' }));

    expect(mocks.replace).toHaveBeenCalledWith('/me');
  });

  it('셸이 알람을 못 쓴다고 답했으면 알람 단계를 건너뛴다', () => {
    mocks.status = { supported: false };
    render(<PremiumOnboardingScreen returnTo="/me" />);

    fireEvent.click(screen.getByRole('button', { name: '다음' }));

    expect(mocks.replace).toHaveBeenCalledWith('/me');
  });

  it('갈 곳이 없으면 홈으로 간다', () => {
    mocks.alarmShell = false;
    render(<PremiumOnboardingScreen />);

    fireEvent.click(screen.getByRole('button', { name: '다음' }));

    expect(mocks.replace).toHaveBeenCalledWith('/scenario');
  });

  it('예전에 알람을 등록해 둔 재구독자는 등록 흐름 없이 원래 가던 곳으로 간다 — 기존 시각을 덮어쓰지 않게', () => {
    mocks.setting = { time: '07:30', enabled: true };
    render(<PremiumOnboardingScreen returnTo="/me" />);

    fireEvent.click(screen.getByRole('button', { name: '다음' }));

    expect(mocks.replace).toHaveBeenCalledWith('/me');
  });

  it('들어오면 구독을 다시 받는다 — 서버 반영이 늦었던 결제도 알람 예약이 유료로 보게', () => {
    render(<PremiumOnboardingScreen returnTo="/me" />);

    expect(mocks.invalidateQueries).toHaveBeenCalledTimes(1);
  });

  it('환급이 열리기 전에는 들어와서 「다음」을 눌러도 환급을 묻지 않는다', () => {
    render(<PremiumOnboardingScreen returnTo="/me" />);

    fireEvent.click(screen.getByRole('button', { name: '다음' }));

    expect(mocks.fetchLatest).not.toHaveBeenCalled();
    expect(mocks.refreshReward).not.toHaveBeenCalled();
  });

  it('알람 설정을 아직 못 받았으면 받을 때까지 기다렸다가 알람 등록으로 이어진다', async () => {
    // given — 조회가 아직 안 끝났고, 끝나면 등록 전이다
    mocks.setting = undefined;
    mocks.refetch.mockResolvedValue({ data: { time: null, enabled: false } });
    render(<PremiumOnboardingScreen returnTo="/me" />);

    // when
    fireEvent.click(screen.getByRole('button', { name: '다음' }));

    // then
    await waitFor(() =>
      expect(
        screen.getByRole('button', { name: '다음에 할게요' }),
      ).toBeVisible(),
    );
    expect(mocks.replace).not.toHaveBeenCalled();
  });

  it('알람 설정을 끝내 못 받으면 등록 흐름 없이 원래 가던 곳으로 간다 — 등록해 둔 시각을 덮어쓸 수 있어서', async () => {
    // given — 조회가 실패했다
    mocks.setting = undefined;
    mocks.refetch.mockResolvedValue({ data: undefined });
    render(<PremiumOnboardingScreen returnTo="/me" />);

    // when
    fireEvent.click(screen.getByRole('button', { name: '다음' }));

    // then
    await waitFor(() => expect(mocks.replace).toHaveBeenCalledWith('/me'));
  });

  it('알람 단계에 들어온 뒤 셸이 알람을 못 쓴다고 답하면 원래 가던 곳으로 간다', () => {
    // given — 셸이 아직 답하지 않은 채 알람 단계에 들어왔다
    mocks.status = null;
    const { rerender } = render(<PremiumOnboardingScreen returnTo="/me" />);
    fireEvent.click(screen.getByRole('button', { name: '다음' }));
    expect(mocks.replace).not.toHaveBeenCalled();

    // when — 뒤늦게 지원하지 않는다는 답이 온다
    mocks.status = { supported: false };
    rerender(<PremiumOnboardingScreen returnTo="/me" />);

    // then
    expect(mocks.replace).toHaveBeenCalledWith('/me');
  });

  it('환급이 열리기 전에는 환급 상품을 산 사람이어도 안내를 끼우지 않는다', async () => {
    mocks.reward = bought();
    render(<PremiumOnboardingScreen returnTo="/me" />);

    fireEvent.click(screen.getByRole('button', { name: '다음' }));

    expect(await screen.findByText('기본 문구')).toBeVisible();
  });

  describe('환급이 열린 뒤', () => {
    beforeEach(() => {
      mocks.launched = true;
    });

    const tapNext = () =>
      fireEvent.click(screen.getByRole('button', { name: '다음' }));

    it('환영 다음에 산 상품의 금액으로 환급 안내를 본다', async () => {
      mocks.reward = bought();
      render(<PremiumOnboardingScreen returnTo="/me" />);

      tapNext();

      expect(await screen.findByText('최대 31,920원')).toBeVisible();
      expect(screen.getByText('92일 동안 매일 하면 돌려받아요')).toBeVisible();
    });

    it('환급 안내를 넘기면 알람 등록이 환급 문구로 나온다', async () => {
      mocks.reward = bought();
      render(<PremiumOnboardingScreen returnTo="/me" />);
      tapNext();
      await screen.findByText('최대 31,920원');

      tapNext();

      expect(await screen.findByText('환급 문구')).toBeVisible();
    });

    it('알람을 못 쓰는 셸이어도 환급 안내는 보고 나간다', async () => {
      mocks.alarmShell = false;
      mocks.reward = bought();
      render(<PremiumOnboardingScreen returnTo="/me" />);
      tapNext();
      await screen.findByText('최대 31,920원');

      tapNext();

      await waitFor(() => expect(mocks.replace).toHaveBeenCalledWith('/me'));
    });

    it('환급과 상관없는 상품을 샀으면 환급 안내 없이 알람 등록으로 간다', async () => {
      render(<PremiumOnboardingScreen returnTo="/me" />);

      tapNext();

      expect(await screen.findByText('기본 문구')).toBeVisible();
    });

    it('들어오자마자 환급을 미리 받는다 — 「다음」을 눌렀을 때 기다리지 않게', () => {
      render(<PremiumOnboardingScreen returnTo="/me" />);

      expect(mocks.fetchLatest).toHaveBeenCalledTimes(1);
    });

    it('환급과 상관없다는 답이면 한 번 더 물어본다 — 서버 반영이 늦었을 수 있다', async () => {
      // given — 처음 답은 "상관없음", 다시 물으니 방금 산 상품이 잡힌다
      mocks.fetchLatest.mockImplementation((_, options?: { fresh: boolean }) =>
        Promise.resolve(options?.fresh ? bought() : null),
      );
      render(<PremiumOnboardingScreen returnTo="/me" />);

      tapNext();

      expect(await screen.findByText('최대 31,920원')).toBeVisible();
    });

    it('들어오면 결제 전에 받아 둔 환급을 새로 받는다', () => {
      render(<PremiumOnboardingScreen returnTo="/me" />);

      expect(mocks.refreshReward).toHaveBeenCalledTimes(1);
    });

    it('지난 회차만 남은 사람이 다시 샀을 때도 한 번 더 물어 안내를 보여 준다', async () => {
      // given — 처음 답은 "끝남", 다시 물으니 방금 산 상품이 잡힌다
      mocks.fetchLatest.mockImplementation((_, options?: { fresh: boolean }) =>
        Promise.resolve(options?.fresh ? bought() : endedRewardView(31920)),
      );
      render(<PremiumOnboardingScreen returnTo="/me" />);

      tapNext();

      expect(await screen.findByText('최대 31,920원')).toBeVisible();
    });

    it('환급 응답이 끝내 오지 않으면 안내 없이 알람 등록으로 넘어간다', async () => {
      // given — 응답이 오지 않는 연결. 결제 직후의 화면이 멈춰 있으면 안 된다
      vi.useFakeTimers();
      mocks.fetchLatest.mockImplementation(() => new Promise(() => {}));
      render(<PremiumOnboardingScreen returnTo="/me" />);
      tapNext();

      await act(() => vi.advanceTimersByTimeAsync(5000));

      expect(screen.getByText('기본 문구')).toBeVisible();
      vi.useRealTimers();
    });

    it('환급을 받는 동안에는 「다음」이 다시 눌리지 않는다', async () => {
      // given — 겹쳐 눌린 탭이 안내의 「다음」에 떨어지면 안내를 읽지 못하고 넘어간다
      mocks.reward = bought();
      render(<PremiumOnboardingScreen returnTo="/me" />);

      tapNext();

      expect(screen.getByRole('button', { name: '다음' })).toBeDisabled();
      expect(await screen.findByText('최대 31,920원')).toBeVisible();
    });
  });

  describe('미리보기 — 개발자 묶음에서 ADMIN이 케이스를 골라 연다', () => {
    it('알람 등록까지 보기: 이미 등록한 계정이어도 알람 등록으로 이어진다', () => {
      signIn('ADMIN');
      mocks.setting = { time: '07:30', enabled: true };
      render(<PremiumOnboardingScreen returnTo="/me" preview="alarm" />);

      fireEvent.click(screen.getByRole('button', { name: '다음' }));

      expect(screen.getByText('기본 문구')).toBeVisible();
      expect(mocks.replace).not.toHaveBeenCalled();
    });

    it('환급 문구로 보기: 환영 다음에 환급 규칙이 먼저 나온다', () => {
      signIn('ADMIN');
      render(<PremiumOnboardingScreen returnTo="/me" preview="refund" />);

      fireEvent.click(screen.getByRole('button', { name: '다음' }));

      // 쉬면 0원이 된다는 걸 알람보다 먼저 말한다
      expect(
        screen.getByText('하루를 통째로 쉬면 쌓인 금액이 0원이 돼요'),
      ).toBeVisible();
    });

    it('환급 문구로 보기: 규칙을 넘기면 알람 등록이 환급 문구로 나온다', () => {
      signIn('ADMIN');
      render(<PremiumOnboardingScreen returnTo="/me" preview="refund" />);

      fireEvent.click(screen.getByRole('button', { name: '다음' }));
      fireEvent.click(screen.getByRole('button', { name: '다음' }));

      expect(screen.getByText('환급 문구')).toBeVisible();
    });

    it('환영만 보기: 등록 전 계정이어도 알람 등록 없이 돌아간다', () => {
      signIn('ADMIN');
      render(<PremiumOnboardingScreen returnTo="/me" preview="welcome" />);

      fireEvent.click(screen.getByRole('button', { name: '다음' }));

      expect(mocks.replace).toHaveBeenCalledWith('/me');
    });

    it('ADMIN이 아니면 미리보기를 무시한다 — 주소를 고쳐도 실제 상태대로 간다', () => {
      signIn('USER');
      mocks.setting = { time: '07:30', enabled: true };
      render(<PremiumOnboardingScreen returnTo="/me" preview="refund" />);

      fireEvent.click(screen.getByRole('button', { name: '다음' }));

      expect(mocks.replace).toHaveBeenCalledWith('/me');
    });
  });
});
