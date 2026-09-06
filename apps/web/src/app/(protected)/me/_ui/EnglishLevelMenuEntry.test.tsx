// EnglishLevelMenuEntry — 마이페이지에서 영어 수준을 다시 고를 수 있는 진입점 계약 검증
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

import * as levelApi from '@/features/onboarding/api/learning-level';
import { track } from '@/shared/analytics';

import { EnglishLevelMenuEntry } from './EnglishLevelMenuEntry';

vi.mock('motion/react', () => import('@/shared/motion/test-double'));
vi.mock('@/shared/analytics', () => ({ track: vi.fn() }));
vi.mock('@/shared/monitoring/report', () => ({ reportWarning: vi.fn() }));
vi.mock('@/shared/auth/auth-store', () => ({
  useAuthStore: (selector: (state: unknown) => unknown) =>
    selector({ member: { userId: 42 } }),
}));
vi.mock('@/features/onboarding/api/learning-level', () => ({
  getMyLearningLevel: vi.fn(),
  updateLearningLevel: vi.fn(() => Promise.resolve(null)),
}));

const trackMock = vi.mocked(track);
const getMyLearningLevel = vi.mocked(levelApi.getMyLearningLevel);

const renderEntry = () =>
  render(
    <QueryClientProvider client={new QueryClient()}>
      <EnglishLevelMenuEntry />
    </QueryClientProvider>,
  );

const openSheet = async () => {
  await waitFor(() => expect(getMyLearningLevel).toHaveBeenCalled());
  fireEvent.click(screen.getByText('학습 수준 변경하기'));
};

beforeEach(() => {
  getMyLearningLevel.mockResolvedValue({ learningLevel: null });
});

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe('EnglishLevelMenuEntry', () => {
  it('메뉴 행을 누르면 선택지 시트가 열린다', async () => {
    renderEntry();

    await openSheet();

    expect(
      screen.getByText('영어를 이제 막 배우기 시작했어요'),
    ).toBeInTheDocument();
  });

  it('서버가 준 지금 값을 강조해서 보여주고, 확인 버튼은 이미 활성 상태다', async () => {
    getMyLearningLevel.mockResolvedValue({ learningLevel: 4 });

    renderEntry();
    await openSheet();

    expect(
      screen
        .getByText('다양한 숙어 및 문법 규칙을 적용할 수 있어요')
        .closest('button'),
    ).toHaveAttribute('aria-pressed', 'true');
    expect(
      screen.getByText('선택했어요!').closest('button'),
    ).not.toBeDisabled();
  });

  it('서버에 답이 없으면 확인 버튼이 비활성 상태다', async () => {
    renderEntry();

    await openSheet();

    expect(screen.getByText('선택했어요!').closest('button')).toBeDisabled();
  });

  it('다른 선택지를 고르고 확인을 눌러야 서버에 실리고 시트가 닫힌다', async () => {
    getMyLearningLevel.mockResolvedValue({ learningLevel: 1 });

    renderEntry();
    await openSheet();
    fireEvent.click(screen.getByText('단어를 조합해서 말할 수 있어요'));
    expect(levelApi.updateLearningLevel).not.toHaveBeenCalled();

    fireEvent.click(screen.getByText('선택했어요!'));

    expect(
      screen.queryByText('단어를 조합해서 말할 수 있어요'),
    ).not.toBeInTheDocument();
    await waitFor(() =>
      expect(levelApi.updateLearningLevel).toHaveBeenCalledWith(2),
    );
    expect(trackMock).toHaveBeenCalledWith(EVENTS.ENGLISH_LEVEL_CHANGED, {
      level: 2,
    });
  });
});
