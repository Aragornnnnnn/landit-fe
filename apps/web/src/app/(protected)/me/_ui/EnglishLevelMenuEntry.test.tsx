// EnglishLevelMenuEntry — 마이페이지에서 영어 수준을 다시 고를 수 있는 진입점 계약 검증
import { EVENTS } from '@landit/analytics';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { markEnglishLevelAnswered } from '@/features/onboarding/model/english-level';
import { track } from '@/shared/analytics';

import { EnglishLevelMenuEntry } from './EnglishLevelMenuEntry';

vi.mock('motion/react', () => import('@/shared/motion/test-double'));
vi.mock('@/shared/analytics', () => ({ track: vi.fn() }));
vi.mock('@/features/onboarding/api/learning-level', () => ({
  updateLearningLevel: vi.fn(() => Promise.resolve(null)),
}));

const trackMock = vi.mocked(track);

beforeEach(() => localStorage.clear());

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe('EnglishLevelMenuEntry', () => {
  it('메뉴 행을 누르면 선택지 시트가 열린다', () => {
    render(<EnglishLevelMenuEntry />);

    fireEvent.click(screen.getByText('내 영어 수준'));

    expect(
      screen.getByText('영어를 이제 막 배우기 시작했어요'),
    ).toBeInTheDocument();
  });

  it('지금 값을 강조해서 보여주고, 확인 버튼은 이미 활성 상태다', () => {
    markEnglishLevelAnswered('ADVANCED');

    render(<EnglishLevelMenuEntry />);
    fireEvent.click(screen.getByText('내 영어 수준'));

    expect(
      screen
        .getByText('다양한 숙어 및 문법 규칙을 적용할 수 있어요')
        .closest('button'),
    ).toHaveAttribute('aria-pressed', 'true');
    expect(
      screen.getByText('선택했어요!').closest('button'),
    ).not.toBeDisabled();
  });

  it('처음 여는데 아직 답한 적 없으면 확인 버튼이 비활성 상태다', () => {
    render(<EnglishLevelMenuEntry />);
    fireEvent.click(screen.getByText('내 영어 수준'));

    expect(screen.getByText('선택했어요!').closest('button')).toBeDisabled();
  });

  it('다른 선택지를 고르고 확인을 눌러야 바뀌고 시트가 닫힌다', () => {
    markEnglishLevelAnswered('BEGINNER');

    render(<EnglishLevelMenuEntry />);
    fireEvent.click(screen.getByText('내 영어 수준'));
    fireEvent.click(screen.getByText('단어를 조합해서 말할 수 있어요'));
    expect(localStorage.getItem('landit-english-level')).toBe('BEGINNER');

    fireEvent.click(screen.getByText('선택했어요!'));

    expect(localStorage.getItem('landit-english-level')).toBe('ELEMENTARY');
    expect(
      screen.queryByText('단어를 조합해서 말할 수 있어요'),
    ).not.toBeInTheDocument();
    expect(trackMock).toHaveBeenCalledWith(EVENTS.ENGLISH_LEVEL_CHANGED, {
      level: 'ELEMENTARY',
    });
  });
});
