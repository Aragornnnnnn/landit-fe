// ProfileGate — 온보딩을 이미 마친 기존 유저에게 서버가 "아직 안 답했다"고 한 질문만 묻는 계약 검증
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
import * as levelApi from '../api/learning-level';
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
  updateAccentLocale: vi.fn(() => Promise.resolve(null)),
}));
vi.mock('../api/learning-level', () => ({
  getMyLearningLevel: vi.fn(),
  updateLearningLevel: vi.fn(() => Promise.resolve(null)),
}));

const trackMock = vi.mocked(track);
const getMyAccentLocale = vi.mocked(accentApi.getMyAccentLocale);
const getMyLearningLevel = vi.mocked(levelApi.getMyLearningLevel);

// 서버가 아는 답 — null이 곧 "아직 안 답함"이다
const serverAnswers = (
  learningLevel: number | null,
  accentLocale: AccentLocale | null,
) => {
  getMyLearningLevel.mockResolvedValue({ learningLevel });
  getMyAccentLocale.mockResolvedValue({ accentLocale, name: null });
};

const renderGate = () =>
  render(
    <QueryClientProvider client={new QueryClient()}>
      <ProfileGate />
    </QueryClientProvider>,
  );

// 조회 두 개가 도착해야 게이트가 뜬다
const waitForGate = () =>
  waitFor(() => expect(screen.getByText('선택했어요!')).toBeInTheDocument());

// 앞 질문(수준)에 답하고 지나간다
const answerLevel = () => {
  fireEvent.click(screen.getByText('단어를 조합해서 말할 수 있어요'));
  fireEvent.click(screen.getByText('선택했어요!'));
};

beforeEach(() => {
  localStorage.clear();
  serverAnswers(null, null);
});

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe('ProfileGate', () => {
  it('온보딩을 아직 안 본 유저에겐 띄우지 않는다 (온보딩 스텝에서 곧 물을 것이라)', async () => {
    renderGate();

    await waitFor(() => expect(getMyLearningLevel).toHaveBeenCalled());
    expect(screen.queryByText('선택했어요!')).not.toBeInTheDocument();
  });

  it('온보딩을 봤고 서버에 답이 없으면 무조건 띄운다', async () => {
    markOnboardingSeen();

    renderGate();

    await waitForGate();
  });

  it('서버에 둘 다 있으면 다시 띄우지 않는다', async () => {
    markOnboardingSeen();
    serverAnswers(3, 'EN_US');

    renderGate();

    await waitFor(() => expect(getMyAccentLocale).toHaveBeenCalled());
    expect(screen.queryByText('선택했어요!')).not.toBeInTheDocument();
  });

  it('둘 다 조회가 실패하면 막지 않는다 — 이미 답한 사람에게 또 묻느니 지나 보낸다', async () => {
    markOnboardingSeen();
    getMyLearningLevel.mockRejectedValue(new Error('network'));
    getMyAccentLocale.mockRejectedValue(new Error('network'));

    renderGate();

    await waitFor(() => expect(getMyLearningLevel).toHaveBeenCalled());
    expect(screen.queryByText('선택했어요!')).not.toBeInTheDocument();
  });

  it('한쪽 조회만 실패하면 아는 쪽은 묻는다 — 실패한 질문만 다음 방문으로 미룬다', async () => {
    markOnboardingSeen();
    getMyAccentLocale.mockRejectedValue(new Error('network'));

    const { container } = renderGate();

    await waitForGate();
    // 수준만 묻는다 — 나라는 답을 모르니 이번엔 넘어간다
    expect(
      screen.getByText('딱 맞는 학습을 준비해드릴게요'),
    ).toBeInTheDocument();
    expect(container.querySelectorAll('span.h-1\\.5')).toHaveLength(0);

    answerLevel();

    expect(screen.queryByText('선택했어요!')).not.toBeInTheDocument();
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

  it('수준을 답하면 서버에 싣고 닫히지 않은 채 나라 질문으로 이어진다', async () => {
    markOnboardingSeen();

    renderGate();
    await waitForGate();
    answerLevel();

    expect(
      screen.getByText('추천 표현과 피드백이 달라져요'),
    ).toBeInTheDocument();
    // 저장은 화면 전환을 기다리게 하지 않는다 — 캐시에 먼저 심고 요청은 뒤따라 나간다
    await waitFor(() =>
      expect(levelApi.updateLearningLevel).toHaveBeenCalledWith(2),
    );
    expect(trackMock).toHaveBeenCalledWith(EVENTS.PROFILE_GATE_ANSWERED, {
      question: 'level',
      level: 2,
    });
  });

  it('진행점은 답해도 개수가 줄지 않는다 — 처음 물으려던 만큼 그대로 보인다', async () => {
    markOnboardingSeen();

    const { container } = renderGate();
    await waitForGate();
    const countDots = () => container.querySelectorAll('span.h-1\\.5').length;
    expect(countDots()).toBe(2);

    answerLevel();

    expect(countDots()).toBe(2);
  });

  it('물을 게 하나뿐이면 진행점을 그리지 않는다 — 점 하나는 알려주는 게 없다', async () => {
    markOnboardingSeen();
    serverAnswers(3, null);

    const { container } = renderGate();
    await waitForGate();

    expect(container.querySelectorAll('span.h-1\\.5')).toHaveLength(0);
  });

  it('남은 질문을 다 답해야 닫힌다', async () => {
    markOnboardingSeen();

    renderGate();
    await waitForGate();
    answerLevel();
    fireEvent.click(screen.getByText('선택했어요!'));

    expect(screen.queryByText('선택했어요!')).not.toBeInTheDocument();
    await waitFor(() =>
      expect(accentApi.updateAccentLocale).toHaveBeenCalledWith('EN_US'),
    );
    expect(trackMock).toHaveBeenCalledWith(EVENTS.PROFILE_GATE_ANSWERED, {
      question: 'accent',
      accent: 'EN_US',
    });
  });

  it('안 답한 질문만 묻는다 — 수준이 이미 있으면 나라부터 묻고 끝난다', async () => {
    markOnboardingSeen();
    serverAnswers(3, null);

    renderGate();
    await waitForGate();

    expect(
      screen.getByText('추천 표현과 피드백이 달라져요'),
    ).toBeInTheDocument();
    expect(trackMock).toHaveBeenCalledWith(EVENTS.PROFILE_GATE_VIEWED, {
      question: 'accent',
    });

    fireEvent.click(screen.getByText('선택했어요!'));

    expect(screen.queryByText('선택했어요!')).not.toBeInTheDocument();
  });

  it('수준 질문은 고르기 전엔 확인 버튼이 잠겨 있다 — 기본값이 없다', async () => {
    markOnboardingSeen();

    renderGate();
    await waitForGate();

    expect(screen.getByText('선택했어요!').closest('button')).toBeDisabled();
  });
});
