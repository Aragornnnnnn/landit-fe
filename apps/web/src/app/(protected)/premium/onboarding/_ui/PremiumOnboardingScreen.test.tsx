// 프리미엄 온보딩 — 환영 뒤 알람 등록으로 이어지는지, 어느 길로 끝나든 원래 가던 곳으로 replace하는지
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { PremiumOnboardingScreen } from './PremiumOnboardingScreen';

const mocks = vi.hoisted(() => ({
  replace: vi.fn(),
  alarmShell: true,
  status: null as { supported: boolean } | null,
  setting: undefined as { time: string; enabled: boolean } | undefined,
  invalidateQueries: vi.fn(),
}));

vi.mock('@tanstack/react-query', () => ({
  useQueryClient: () => ({ invalidateQueries: mocks.invalidateQueries }),
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
  useAlarmSettingQuery: () => ({ data: mocks.setting }),
}));
vi.mock('@/features/alarm/ui/LockScreenPreview', () => ({
  preloadIntroPreview: vi.fn(),
}));
// 환영 연출과 등록 흐름은 갈 길만 보이는 버튼으로 바꾼다 — 여기선 넘어가는 길만 본다
vi.mock('./PremiumWelcome', () => ({
  PremiumWelcome: ({ onNext }: { onNext: () => void }) => (
    <button type="button" onClick={onNext}>
      다음
    </button>
  ),
}));
vi.mock('@/features/alarm/ui/AlarmSetupFlow', () => ({
  AlarmSetupFlow: ({
    onSkip,
    onDone,
  }: {
    onSkip: () => void;
    onDone: () => void;
  }) => (
    <>
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
  mocks.setting = undefined;
  mocks.invalidateQueries.mockClear();
});
afterEach(() => cleanup());

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
});
