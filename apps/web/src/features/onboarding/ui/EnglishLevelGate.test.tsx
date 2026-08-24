// EnglishLevelGate — 온보딩을 이미 마친 기존 유저에게 영어 수준을 무조건 묻는 게이트 계약 검증
import { EVENTS } from '@landit/analytics';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { track } from '@/shared/analytics';
import { markOnboardingSeen } from '@/shared/auth/onboarding-seen';

import { EnglishLevelGate } from './EnglishLevelGate';

vi.mock('@/shared/analytics', () => ({ track: vi.fn() }));

const trackMock = vi.mocked(track);

beforeEach(() => localStorage.clear());

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe('EnglishLevelGate', () => {
  it('온보딩을 아직 안 본 유저에겐 띄우지 않는다 (온보딩 스텝에서 곧 물을 것이라)', () => {
    render(<EnglishLevelGate />);

    expect(screen.queryByText('선택했어요!')).not.toBeInTheDocument();
  });

  it('온보딩을 봤고 아직 답한 적 없으면 무조건 띄운다', () => {
    markOnboardingSeen();

    render(<EnglishLevelGate />);

    expect(screen.getByText('선택했어요!')).toBeInTheDocument();
  });

  it('이미 답한 유저에겐 다시 띄우지 않는다', () => {
    markOnboardingSeen();
    localStorage.setItem('landit-english-level', 'BEGINNER');

    render(<EnglishLevelGate />);

    expect(screen.queryByText('선택했어요!')).not.toBeInTheDocument();
  });

  it('건너뛸 방법이 없다 — 닫기·나중에 버튼이 없다', () => {
    markOnboardingSeen();

    render(<EnglishLevelGate />);

    expect(
      screen.queryByText(/나중에|다음에|건너뛰기|닫기/),
    ).not.toBeInTheDocument();
  });

  it('선택지를 고르기 전엔 확인 버튼이 비활성 상태다', () => {
    markOnboardingSeen();

    render(<EnglishLevelGate />);

    expect(screen.getByText('선택했어요!').closest('button')).toBeDisabled();
  });

  it('선택지를 고르고 확인하면 저장하고 닫힌다', () => {
    markOnboardingSeen();

    render(<EnglishLevelGate />);
    fireEvent.click(screen.getByText('단어를 조합해서 말할 수 있어요'));
    fireEvent.click(screen.getByText('선택했어요!'));

    expect(localStorage.getItem('landit-english-level')).toBe('ELEMENTARY');
    expect(screen.queryByText('선택했어요!')).not.toBeInTheDocument();
    expect(trackMock).toHaveBeenCalledWith(EVENTS.ENGLISH_LEVEL_GATE_ANSWERED, {
      level: 'ELEMENTARY',
    });
  });
});
