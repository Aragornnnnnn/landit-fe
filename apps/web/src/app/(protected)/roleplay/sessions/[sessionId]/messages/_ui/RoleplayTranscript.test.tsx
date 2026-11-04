// 롤플레이 대화 기록 — 상대 말은 번역까지, 내 말 아래엔 고친 말이 붙는다. 마지막 버튼은 홈이다
import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest';

import type { RoleplayHistoryDetail } from '@/features/roleplay/api/roleplay';
import { useRoleplaySessionQuery } from '@/features/roleplay/model/useRoleplaySessionQuery';

import { RoleplayTranscript } from './RoleplayTranscript';

const replace = vi.hoisted(() => vi.fn());
vi.mock('next/navigation', () => ({
  useRouter: () => ({ replace, push: vi.fn(), back: vi.fn() }),
}));
vi.mock('@/features/roleplay/model/useRoleplaySessionQuery', () => ({
  useRoleplaySessionQuery: vi.fn(),
}));

const track = vi.hoisted(() => vi.fn());
vi.mock('@/shared/analytics', () => ({ track }));

const PREPARING = '더 자연스러운 말을 찾는 중…';
const GOOD_JOB = '잘했어요!';

const detail: RoleplayHistoryDetail = {
  sessionId: 7,
  title: '카페에서 커피 주문하기',
  characterId: 'chloe',
  targetLocale: 'EN',
  baseLocale: 'KR',
  roleplay: { userRole: '손님', aiRole: '바리스타', situation: '주문하기' },
  messages: [
    {
      messageId: 1,
      turnNumber: 1,
      messageSequence: 1,
      role: 'AI',
      content: 'Hi there! Are you looking for something new today?',
      translatedContent: '안녕하세요! 오늘 새로운 거 찾으세요?',
      emotion: null,
      correction: null,
      reusedExpression: null,
    },
    {
      messageId: 2,
      turnNumber: 1,
      messageSequence: 2,
      role: 'USER',
      content: 'Yes, can you recommend me new menu?',
      translatedContent: null,
      emotion: null,
      correction: {
        status: 'COMPLETED',
        sentence: {
          originalSentence: 'Yes, can you recommend me new menu?',
          betterSentence: 'Could you recommend something new?',
          reason: "'recommend me'는 어색해요.",
          mistakePattern: 'WORD_CHOICE',
          memoryObservedOn: null,
          memoryLabel: null,
        },
      },
      reusedExpression: null,
    },
  ],
};

beforeAll(() => {
  // jsdom엔 스크롤이 없다 — 첫 교정으로 데려가는 동작은 여기 관심사가 아니다
  Element.prototype.scrollIntoView = vi.fn();
});

afterEach(() => {
  cleanup();
  replace.mockClear();
});

describe('RoleplayTranscript', () => {
  it('제목과 주고받은 말, 고친 말을 보여 준다', () => {
    vi.mocked(useRoleplaySessionQuery).mockReturnValue({
      session: detail,
      error: null,
      waitExpired: false,
      retry: vi.fn(),
    });

    render(<RoleplayTranscript sessionId={7} />);

    expect(screen.getByText('카페에서 커피 주문하기')).toBeInTheDocument();
    expect(
      screen.getByText('안녕하세요! 오늘 새로운 거 찾으세요?'),
    ).toBeInTheDocument();
    expect(
      screen.getByText('Could you recommend something new?'),
    ).toBeInTheDocument();
  });

  it('장기기억을 근거로 고쳤으면 그 날짜와 내용을 태그로 보여 준다', () => {
    const [partner, mine] = detail.messages;
    vi.mocked(useRoleplaySessionQuery).mockReturnValue({
      session: {
        ...detail,
        messages: [
          partner,
          {
            ...mine,
            correction: {
              status: 'COMPLETED',
              sentence: {
                ...mine.correction!.sentence!,
                memoryObservedOn: '2026-09-03',
                memoryLabel: '헬스장',
              },
            },
          },
        ],
      },
      error: null,
      waitExpired: false,
      retry: vi.fn(),
    });

    render(<RoleplayTranscript sessionId={7} />);

    expect(screen.getByText(/9\/3 스몰톡에서 말한 헬스장/)).toBeInTheDocument();
  });

  const showPreparing = (waitExpired: boolean) => {
    const [partner, mine] = detail.messages;
    vi.mocked(useRoleplaySessionQuery).mockReturnValue({
      session: {
        ...detail,
        messages: [
          partner,
          { ...mine, correction: { status: 'PREPARING', sentence: null } },
        ],
      },
      error: null,
      waitExpired,
      retry: vi.fn(),
    });
    render(<RoleplayTranscript sessionId={7} />);
  };

  it('교정을 만드는 중이면 찾는 중이라고 알린다', () => {
    showPreparing(false);

    expect(screen.getByText(PREPARING)).toBeInTheDocument();
  });

  it('상한까지 기다렸으면 찾는 중 표시를 거둔다', () => {
    showPreparing(true);

    expect(screen.queryByText(PREPARING)).not.toBeInTheDocument();
  });

  const showWithoutSentence = (status: 'COMPLETED' | 'FAILED') => {
    const [partner, mine] = detail.messages;
    vi.mocked(useRoleplaySessionQuery).mockReturnValue({
      session: {
        ...detail,
        messages: [
          partner,
          { ...mine, correction: { status, sentence: null } },
        ],
      },
      error: null,
      waitExpired: false,
      retry: vi.fn(),
    });
    render(<RoleplayTranscript sessionId={7} />);
  };

  it('다 살펴보고 고칠 게 없었던 말엔 칭찬을 붙인다', () => {
    showWithoutSentence('COMPLETED');

    expect(screen.getByText(GOOD_JOB)).toBeInTheDocument();
  });

  it('교정을 만들다 실패한 말은 칭찬하지 않는다', () => {
    showWithoutSentence('FAILED');

    expect(screen.queryByText(GOOD_JOB)).not.toBeInTheDocument();
  });

  it('홈으로 돌아가기를 누르면 롤플레이 탭으로 간다', async () => {
    vi.mocked(useRoleplaySessionQuery).mockReturnValue({
      session: detail,
      error: null,
      waitExpired: false,
      retry: vi.fn(),
    });
    render(<RoleplayTranscript sessionId={7} />);

    await userEvent.click(
      screen.getByRole('button', { name: '홈으로 돌아갈게요' }),
    );

    expect(replace).toHaveBeenCalledWith('/roleplay');
  });

  it('뒤로 가면 요약으로 돌아간다 — 축하는 다시 하지 않는다', async () => {
    vi.mocked(useRoleplaySessionQuery).mockReturnValue({
      session: detail,
      error: null,
      waitExpired: false,
      retry: vi.fn(),
    });
    render(<RoleplayTranscript sessionId={7} />);

    await userEvent.click(screen.getByRole('button', { name: '뒤로' }));

    expect(replace).toHaveBeenCalledWith('/roleplay/sessions/7/summary');
  });

  it('지난 대화 목록에서 왔으면 뒤로 가기가 그 목록으로 간다', async () => {
    vi.mocked(useRoleplaySessionQuery).mockReturnValue({
      session: detail,
      error: null,
      waitExpired: false,
      retry: vi.fn(),
    });
    render(<RoleplayTranscript sessionId={7} fromRoleplayId={5} />);

    await userEvent.click(screen.getByRole('button', { name: '뒤로' }));

    expect(replace).toHaveBeenCalledWith('/roleplay/5/sessions');
  });

  describe('계측', () => {
    const showDetail = () =>
      vi.mocked(useRoleplaySessionQuery).mockReturnValue({
        session: detail,
        error: null,
        waitExpired: false,
        retry: vi.fn(),
      });

    it('요약에서 왔으면 source를 summary로, 보여 줄 교정 수와 함께 남긴다', () => {
      track.mockClear();
      showDetail();

      render(<RoleplayTranscript sessionId={7} />);

      expect(track).toHaveBeenCalledWith('Roleplay Feedback Viewed', {
        session_id: 7,
        source: 'summary',
        correction_count: 1,
      });
    });

    it('지난 대화 목록에서 왔으면 source를 history로 남긴다', () => {
      track.mockClear();
      showDetail();

      render(<RoleplayTranscript sessionId={7} fromRoleplayId={5} />);

      expect(track).toHaveBeenCalledWith(
        'Roleplay Feedback Viewed',
        expect.objectContaining({ source: 'history' }),
      );
    });
  });
});
