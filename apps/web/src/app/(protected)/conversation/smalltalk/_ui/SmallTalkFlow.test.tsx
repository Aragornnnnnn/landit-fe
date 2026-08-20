// SmallTalkFlow — 대화를 열 수 있을 때만 본편을 띄운다.
// 못 여는 이유(세션 시작 실패·잔량 조회 실패)가 무엇이든 기다리는 화면에 가두지 않는다
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import type { SmallTalkMainResponse } from '@/features/small-talk/api/small-talk';
import { useSmallTalkMainQuery } from '@/features/small-talk/model/useSmallTalkMainQuery';

import { useSmallTalkSession } from '../_model/useSmallTalkSession';
import { SmallTalkFlow } from './SmallTalkFlow';

const replace = vi.hoisted(() => vi.fn());
vi.mock('next/navigation', () => ({ useRouter: () => ({ replace }) }));
vi.mock('../_model/useSmallTalkSession', () => ({
  useSmallTalkSession: vi.fn(),
}));
vi.mock('@/features/small-talk/model/useSmallTalkMainQuery', () => ({
  useSmallTalkMainQuery: vi.fn(),
}));
// 본편은 이 테스트 관심사가 아니다 — 열렸는지만 본다
vi.mock('./SmallTalkConversation', () => ({
  SmallTalkConversation: () => <div>대화 본편</div>,
}));

const sessionMock = vi.mocked(useSmallTalkSession);
const mainMock = vi.mocked(useSmallTalkMainQuery);
const end = vi.fn();

const setup = ({
  session = { sessionId: 7 },
  sessionError = null as unknown,
  main = {
    remainingSpeakingTimeMs: 40_000,
  } as Partial<SmallTalkMainResponse> | null,
  mainError = undefined as Error | undefined,
} = {}) => {
  sessionMock.mockReturnValue({
    session: session as never,
    error: sessionError,
    end,
  });
  mainMock.mockReturnValue({
    main: main as SmallTalkMainResponse | null,
    error: mainError ?? null,
    isLoading: false,
    retry: vi.fn(),
  });
  render(<SmallTalkFlow startMode="USER_FIRST" partner="chloe" />);
};

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe('SmallTalkFlow', () => {
  it('세션과 오늘 남은 시간이 모두 있으면 대화를 연다', () => {
    setup();

    expect(screen.getByText('대화 본편')).toBeInTheDocument();
  });

  it('잔량 조회가 실패하면 기다리는 화면 대신 안내를 보여준다', () => {
    // main이 영영 null이라 조건만 보면 스켈레톤에 갇힌다
    setup({ main: null, mainError: new Error('500') });

    expect(screen.getByText(/대화를 시작하지 못했어요/)).toBeInTheDocument();
  });

  it('안내에서 돌아갈 때 이미 열린 세션을 정리한다', () => {
    // 잔량만 못 받은 경우라 서버에는 세션이 열려 있다
    setup({ main: null, mainError: new Error('500') });

    fireEvent.click(screen.getByRole('button', { name: '돌아가기' }));

    expect(end).toHaveBeenCalled();
    expect(replace).toHaveBeenCalled();
  });
});
