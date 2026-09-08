// ProfileGate — 온보딩을 이미 마친 기존 유저에게 서버가 "아직 안 답했다"고 한 질문(배울 영어)만 묻는 계약 검증.
// 영어 수준은 더 이상 묻지 않는다 — 첫 대화로 서버가 매긴다
import { EVENTS, type AccentLocale } from '@landit/analytics';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { track } from '@/shared/analytics';
import { markOnboardingSeen } from '@/shared/auth/onboarding-seen';

import * as accentApi from '../api/accent';
import { ProfileGate } from './ProfileGate';

vi.mock('motion/react', () => import('@/shared/motion/test-double'));
vi.mock('@/shared/analytics', () => ({ track: vi.fn() }));
vi.mock('@/shared/monitoring/report', () => ({ reportWarning: vi.fn() }));
// next/image는 next 밑의 react 복사본을 잡아 훅 dispatcher가 null이 된다 (HeaderStreak 테스트와 같은 이유)
vi.mock('next/image', () => ({ default: () => <span /> }));
vi.mock('@/shared/auth/auth-store', () => ({
  useAuthStore: (selector: (state: unknown) => unknown) =>
    selector({ member: { userId: 42 } }),
}));
vi.mock('../api/accent', () => ({
  getMyAccentLocale: vi.fn(),
  updateAccentLocale: vi.fn(),
}));

const trackMock = vi.mocked(track);
const getMyAccentLocale = vi.mocked(accentApi.getMyAccentLocale);
const updateAccentLocale = vi.mocked(accentApi.updateAccentLocale);

// 저장한 값을 기억하는 가짜 서버 — 저장 뒤 무효화로 다시 조회하면 방금 실은 값이 와야 한다
let storedAccent: AccentLocale | null;

const renderGate = () =>
  render(
    <QueryClientProvider client={new QueryClient()}>
      <ProfileGate />
    </QueryClientProvider>,
  );

const waitForGate = () =>
  waitFor(() => expect(screen.getByText('선택했어요!')).toBeInTheDocument());

beforeEach(() => {
  localStorage.clear();
  storedAccent = null;
  getMyAccentLocale.mockImplementation(async () => ({
    accentLocale: storedAccent,
    name: null,
  }));
  updateAccentLocale.mockImplementation(async (accent) => {
    storedAccent = accent;
    return null;
  });
});

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe('ProfileGate', () => {
  it('온보딩을 아직 안 본 유저에겐 띄우지 않는다 (온보딩 스텝에서 곧 물을 것이라)', async () => {
    renderGate();

    await waitFor(() => expect(getMyAccentLocale).toHaveBeenCalled());
    expect(screen.queryByText('선택했어요!')).not.toBeInTheDocument();
  });

  it('온보딩을 봤고 서버에 나라 답이 없으면 무조건 띄운다', async () => {
    markOnboardingSeen();

    renderGate();

    await waitForGate();
    expect(
      screen.getByText('추천 표현과 피드백이 달라져요'),
    ).toBeInTheDocument();
    expect(trackMock).toHaveBeenCalledWith(EVENTS.PROFILE_GATE_VIEWED, {
      question: 'accent',
    });
  });

  it('서버에 나라 답이 있으면 띄우지 않는다', async () => {
    markOnboardingSeen();
    storedAccent = 'EN_US';

    renderGate();

    await waitFor(() => expect(getMyAccentLocale).toHaveBeenCalled());
    expect(screen.queryByText('선택했어요!')).not.toBeInTheDocument();
  });

  it('조회가 실패하면 막지 않는다 — 이미 답한 사람에게 또 묻느니 지나 보낸다', async () => {
    markOnboardingSeen();
    getMyAccentLocale.mockRejectedValue(new Error('network'));

    renderGate();

    await waitFor(() => expect(getMyAccentLocale).toHaveBeenCalled());
    expect(screen.queryByText('선택했어요!')).not.toBeInTheDocument();
  });

  it('영어 수준은 묻지 않는다 — 첫 대화로 서버가 매긴다', async () => {
    markOnboardingSeen();

    renderGate();
    await waitForGate();

    expect(
      screen.queryByText('딱 맞는 학습을 준비해드릴게요'),
    ).not.toBeInTheDocument();
  });

  it('뒤 화면을 가리는 게 아니라 다이얼로그로 격리한다 — 보조기기가 뒤 내용에 닿으면 건너뛸 길이 생긴다', async () => {
    markOnboardingSeen();

    renderGate();
    await waitForGate();

    const dialog = screen.getByRole('dialog');
    expect(dialog).toHaveAttribute('aria-modal', 'true');
    expect(dialog).toHaveAccessibleName();
    expect(dialog).toHaveFocus();
  });

  it('건너뛸 방법이 없다 — 닫기·나중에·뒤로가기 버튼이 없다', async () => {
    markOnboardingSeen();

    renderGate();
    await waitForGate();

    expect(
      screen.queryByText(/나중에|다음에|건너뛰기|닫기/),
    ).not.toBeInTheDocument();
    expect(screen.queryByLabelText('이전')).not.toBeInTheDocument();
  });

  it('물을 게 하나뿐이라 진행점을 그리지 않는다 — 점 하나는 알려주는 게 없다', async () => {
    markOnboardingSeen();

    const { container } = renderGate();
    await waitForGate();

    expect(container.querySelectorAll('span.h-1\\.5')).toHaveLength(0);
  });

  it('나라를 답하면 서버에 싣고 닫힌다', async () => {
    markOnboardingSeen();

    renderGate();
    await waitForGate();
    fireEvent.click(screen.getByText('미국 영어'));
    fireEvent.click(screen.getByText('선택했어요!'));

    await waitFor(() =>
      expect(screen.queryByText('선택했어요!')).not.toBeInTheDocument(),
    );
    // 저장은 네트워크 응답을 기다리게 하지 않는다 — 캐시에 먼저 심고 요청은 뒤따라 나간다
    await waitFor(() =>
      expect(accentApi.updateAccentLocale).toHaveBeenCalledWith('EN_US'),
    );
    expect(trackMock).toHaveBeenCalledWith(EVENTS.PROFILE_GATE_ANSWERED, {
      question: 'accent',
      accent: 'EN_US',
    });
  });

  it('고르기 전엔 확인 버튼이 잠겨 있다 — 안 고른 사람이 기본값으로 저장되지 않게', async () => {
    markOnboardingSeen();

    renderGate();
    await waitForGate();

    expect(screen.getByText('미국 영어').closest('button')).toHaveAttribute(
      'aria-pressed',
      'false',
    );
    expect(screen.getByText('선택했어요!').closest('button')).toBeDisabled();
  });
});
