// 롤플레이 대화 기록 — 상대 말은 번역까지, 내 말 아래엔 고친 말이 붙는다. 마지막 버튼은 홈이다
import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest';

import type { RoleplayHistoryDetail } from '@/features/roleplay/api/roleplay';
import { useRoleplaySessionQuery } from '@/features/roleplay/model/useRoleplaySessionQuery';

import { RoleplayTranscript } from './RoleplayTranscript';

const replace = vi.hoisted(() => vi.fn());
vi.mock('next/navigation', () => ({
  useRouter: () => ({ replace, push: vi.fn() }),
}));
vi.mock('@/features/roleplay/model/useRoleplaySessionQuery', () => ({
  useRoleplaySessionQuery: vi.fn(),
}));

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
        originalSentence: 'Yes, can you recommend me new menu?',
        betterSentence: 'Could you recommend something new?',
        reason: "'recommend me'는 어색해요.",
        mistakePattern: 'WORD_CHOICE',
        memoryTag: null,
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

  it('홈으로 돌아가기를 누르면 롤플레이 탭으로 간다', async () => {
    vi.mocked(useRoleplaySessionQuery).mockReturnValue({
      session: detail,
      error: null,
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
      retry: vi.fn(),
    });
    render(<RoleplayTranscript sessionId={7} />);

    await userEvent.click(screen.getByRole('button', { name: '뒤로' }));

    expect(replace).toHaveBeenCalledWith('/roleplay/sessions/7/summary');
  });
});
