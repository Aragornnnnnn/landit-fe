// 스몰톡 대화 화면 — 남은 말하기 시간 표시는 한도가 있을 때만 그린다.
// 무제한이면 마이크 위 카운트다운도, 마이크 둘레 타이머 링도 없다 (잔량 계산은 뒤에서 그대로 돈다)
// X는 나눈 대화가 있을 때만 종료 시트를 연다 — 없으면 확인 없이 바로 나간다
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import type { SmallTalkSessionStartResponse } from '@/features/small-talk/api/small-talk';

import { GOODBYE_PHRASES } from '../_model/goodbye-phrase';
import { SmallTalkConversation } from './SmallTalkConversation';

const mocks = vi.hoisted(() => ({
  unlimited: false,
  hasAnswered: true,
  leave: vi.fn(),
  replace: vi.fn(),
  prefetch: vi.fn(),
  phase: 'USER_SPEAKING',
}));

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    replace: mocks.replace,
    push: vi.fn(),
    prefetch: mocks.prefetch,
  }),
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
// 시트는 열렸는지만 본다
vi.mock('./SmallTalkExitSheet', () => ({
  SmallTalkExitSheet: ({
    open,
    goodbyePhrase,
  }: {
    open: boolean;
    goodbyePhrase: string;
  }) =>
    open ? (
      <div role="dialog" aria-label="종료 시트">
        {goodbyePhrase}
      </div>
    ) : null,
}));
// 말하는 중인 대화 — 잔량은 15초, 이번 발화에서 3/4가 남았다
vi.mock('../_model/useSmallTalkFlow', () => ({
  useSmallTalkFlow: () => ({
    phase: mocks.phase,
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
    leave: mocks.leave,
    completeTalk: vi.fn(),
    completing: false,
    hasAnswered: mocks.hasAnswered,
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
  mocks.hasAnswered = true;
  mocks.phase = 'USER_SPEAKING';
  vi.clearAllMocks();
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

describe('SmallTalkConversation — 대화 나가기', () => {
  it('나눈 대화가 있으면 X가 종료 시트를 연다', () => {
    renderScreen();

    fireEvent.click(screen.getByRole('button', { name: '대화 나가기' }));

    expect(
      screen.getByRole('dialog', { name: '종료 시트' }),
    ).toBeInTheDocument();
    expect(mocks.leave).not.toHaveBeenCalled();
    // 「대화 종료하기」 뒤 바로 갈 요약 라우트를 미리 받는다
    expect(mocks.prefetch).toHaveBeenCalledWith(
      '/smalltalk/sessions/7/summary',
    );
  });

  it('시트는 작별 인사 목록 중 하나를 예시로 보여 준다', () => {
    renderScreen();

    fireEvent.click(screen.getByRole('button', { name: '대화 나가기' }));

    const sheet = screen.getByRole('dialog', { name: '종료 시트' });
    expect(GOODBYE_PHRASES).toContain(sheet.textContent);
  });

  it('나눈 대화가 없으면 X로 확인 없이 바로 나간다', () => {
    // 마무리할 대화가 없는데 "직접 마무리해 보라"고 권할 이유가 없다
    mocks.hasAnswered = false;
    renderScreen();

    fireEvent.click(screen.getByRole('button', { name: '대화 나가기' }));

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(mocks.leave).toHaveBeenCalled();
    expect(mocks.replace).toHaveBeenCalledWith('/smalltalk');
  });

  it('이미 끝난 대화면 X가 시트 없이 오늘의 스몰톡으로 보낸다', () => {
    // 작별 인사로 끝난 화면에서 "끝내려고요?"를 묻거나 중도 종료를 보낼 이유가 없다
    mocks.phase = 'DONE';
    renderScreen();

    fireEvent.click(screen.getByRole('button', { name: '대화 나가기' }));

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(mocks.leave).not.toHaveBeenCalled();
    expect(mocks.replace).toHaveBeenCalledWith('/smalltalk/sessions/7/summary');
  });
});
