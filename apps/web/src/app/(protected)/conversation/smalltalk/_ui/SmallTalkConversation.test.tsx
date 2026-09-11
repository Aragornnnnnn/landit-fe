// 스몰톡 대화 화면 — 남은 말하기 시간 표시는 한도가 있을 때만 그린다.
// 무제한이면 마이크 위 카운트다운도, 마이크 둘레 타이머 링도 없다 (잔량 계산은 뒤에서 그대로 돈다)
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import type { SmallTalkSessionStartResponse } from '@/features/small-talk/api/small-talk';

import { SmallTalkConversation } from './SmallTalkConversation';

const mocks = vi.hoisted(() => ({ unlimited: false }));

vi.mock('next/navigation', () => ({
  useRouter: () => ({ replace: vi.fn(), push: vi.fn() }),
}));
vi.mock('@/shared/analytics', () => ({ track: vi.fn() }));
vi.mock('@/features/small-talk/model/useSpeakingLimit', () => ({
  useSpeakingLimit: () => ({ unlimited: mocks.unlimited }),
}));
// 무대·오버레이·시트는 이 테스트 관심사가 아니다 — 마이크 주변만 본다
vi.mock('@/features/conversation/ui/flow/CharacterStage', () => ({
  CharacterStage: () => null,
}));
vi.mock('@/features/conversation/ui/flow/ThoughtOverlay', () => ({
  ThoughtOverlay: () => null,
}));
vi.mock('@/features/conversation/ui/flow/MicPermissionSheet', () => ({
  MicPermissionSheet: () => null,
}));
vi.mock('./SmallTalkExitSheet', () => ({ SmallTalkExitSheet: () => null }));
// 말하는 중인 대화 — 잔량은 15초, 이번 발화에서 3/4가 남았다
vi.mock('../_model/useSmallTalkFlow', () => ({
  useSmallTalkFlow: () => ({
    phase: 'USER_SPEAKING',
    turnIndex: 0,
    turn: {
      aiMessage: 'How was your day?',
      aiTranslation: '오늘 하루 어땠어?',
      isUserOpening: false,
      innerThought: '',
      innerThoughtType: 'NORMAL',
    },
    finishedThought: null,
    speech: null,
    input: {
      transcript: '',
      pressMic: vi.fn(),
      cancelInput: vi.fn(),
      finishListening: vi.fn(),
      micPermissionDenied: false,
      dismissMicPermissionNotice: vi.fn(),
    },
    leave: vi.fn(),
    remainingMs: 15_000,
    speakingRatio: 0.75,
    summary: { speakingDurationMs: 0, exchangeCount: 1 },
  }),
}));

const session = {
  sessionId: 7,
  startMode: 'AI_FIRST',
  currentMessage: null,
} as unknown as SmallTalkSessionStartResponse;

const renderScreen = () =>
  render(
    <SmallTalkConversation
      session={session}
      partner="chloe"
      remainingSpeakingTimeMs={15_000}
      endSession={vi.fn()}
    />,
  );

// 타이머 링은 완료 버튼 둘레의 원 두 개(바탕·진행)다 — 아이콘은 원을 쓰지 않는다
const ringCircles = (container: HTMLElement) =>
  container.querySelectorAll('circle').length;

afterEach(() => {
  cleanup();
  mocks.unlimited = false;
});

describe('SmallTalkConversation — 남은 말하기 시간', () => {
  it('한도가 있으면 마이크 위에 카운트다운을, 완료 버튼 둘레에 타이머 링을 그린다', () => {
    const { container } = renderScreen();

    expect(screen.getByText('0:15')).toBeInTheDocument();
    expect(ringCircles(container)).toBeGreaterThan(0);
  });

  it('무제한이면 카운트다운도 타이머 링도 그리지 않는다', () => {
    mocks.unlimited = true;

    const { container } = renderScreen();

    expect(screen.queryByText(/남은 말하기 시간/)).not.toBeInTheDocument();
    expect(ringCircles(container)).toBe(0);
    // 마이크 컨트롤 자체는 그대로다
    expect(
      screen.getByRole('button', { name: '답변 완료' }),
    ).toBeInTheDocument();
  });
});
