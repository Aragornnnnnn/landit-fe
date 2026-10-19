// SatisfactionGate — 소감을 한 번만 묻고, 순간과 답에 따라 갈라지는 계약 검증
import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
} from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { track } from '@/shared/analytics';
import { getNativeContext } from '@/shared/bridge/native-context';

import { requestReviewCardViaBridge } from '../api/shell-review';
import {
  markExpressionCompleted,
  markReviewShown,
  markTalkCompleted,
  PROMPT_RECORD_KEY,
  readReviewAttempt,
  readSatisfactionAnswer,
  recordSatisfactionAnswer,
  shouldAskReview,
  shouldAskSatisfaction,
} from '../model/prompt-record';
import { SatisfactionGate, THANKS_MS } from './SatisfactionGate';

vi.mock('motion/react', () => import('@/shared/motion/test-double'));
vi.mock('@/shared/analytics', () => ({ track: vi.fn() }));
const trackMock = vi.mocked(track);
vi.mock('@/shared/bridge/native-context', () => ({
  getNativeContext: vi.fn(() => null),
}));
const getNativeContextMock = vi.mocked(getNativeContext);
vi.mock('../api/shell-review', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../api/shell-review')>()),
  requestReviewCardViaBridge: vi.fn(),
}));
const requestReviewCardMock = vi.mocked(requestReviewCardViaBridge);

const replace = vi.fn();
vi.mock('next/navigation', () => ({ useRouter: () => ({ replace }) }));

beforeEach(() => {
  localStorage.clear();
  vi.useFakeTimers();
  requestReviewCardMock.mockReset();
});

afterEach(() => {
  cleanup();
  vi.useRealTimers();
});

const ASK = '방금 대화, 어떠셨나요?';

describe('SatisfactionGate', () => {
  it('띄우면 노출을 계측하고, 쌓여 있던 차례를 소비한다', () => {
    markTalkCompleted('scenario');

    render(<SatisfactionGate moment="scenario" />);

    expect(shouldAskSatisfaction('scenario')).toBe(false);

    expect(screen.getByText(ASK)).toBeInTheDocument();
    expect(trackMock).toHaveBeenCalledWith('Satisfaction Prompt Viewed', {
      moment: 'scenario',
    });
  });

  it('스몰톡은 스몰톡 문구로 묻는다', () => {
    markTalkCompleted('smalltalk');

    render(<SatisfactionGate moment="smalltalk" />);

    expect(screen.getByText('첫 스몰톡, 어떠셨나요?')).toBeInTheDocument();
  });

  it('좋았어요를 누르면 감사 문구로 바뀌고 잠시 후 닫힌다', () => {
    markTalkCompleted('scenario');
    render(<SatisfactionGate moment="scenario" />);

    fireEvent.click(screen.getByText(/좋았어요/));

    // 시트는 그대로 두고 안의 말만 바뀐다 — 버튼은 사라진다
    expect(screen.getByText('좋았다니 래디도 기뻐요!')).toBeInTheDocument();
    expect(screen.queryByText(/아쉬웠어요/)).not.toBeInTheDocument();
    expect(readSatisfactionAnswer('scenario')).toBe('good');
    expect(trackMock).toHaveBeenCalledWith('Satisfaction Prompt Answered', {
      moment: 'scenario',
      answer: 'good',
    });

    act(() => vi.advanceTimersByTime(THANKS_MS));

    expect(
      screen.queryByText('좋았다니 래디도 기뻐요!'),
    ).not.toBeInTheDocument();
  });

  it('아쉬웠어요를 누르면 피드백 안내로 바뀌고, 보내기를 누르면 편지함 작성으로 간다', () => {
    markTalkCompleted('scenario');
    render(<SatisfactionGate moment="scenario" />);

    fireEvent.click(screen.getByText(/아쉬웠어요/));

    expect(screen.getByText('아쉬웠군요…')).toBeInTheDocument();
    expect(readSatisfactionAnswer('scenario')).toBe('bad');
    expect(trackMock).toHaveBeenCalledWith('Satisfaction Prompt Answered', {
      moment: 'scenario',
      answer: 'bad',
    });

    fireEvent.click(screen.getByText('피드백 보내기'));

    expect(replace).toHaveBeenCalledWith('/mailbox/compose');
  });

  it('딤을 눌러 닫으면 dismiss로 남기고 다시 묻지 않는다', () => {
    markTalkCompleted('scenario');
    const { rerender } = render(<SatisfactionGate moment="scenario" />);

    // BottomSheet의 딤은 onClose를 부른다 — 사용자가 시트 밖을 탭한 것
    fireEvent.click(screen.getByTestId('bottom-sheet-dim'));

    expect(screen.queryByText(ASK)).not.toBeInTheDocument();
    expect(readSatisfactionAnswer('scenario')).toBe('dismiss');
    expect(trackMock).toHaveBeenCalledWith('Satisfaction Prompt Answered', {
      moment: 'scenario',
      answer: 'dismiss',
    });

    rerender(<SatisfactionGate moment="scenario" />);
    expect(screen.queryByText(ASK)).not.toBeInTheDocument();
  });

  it('피드백 안내까지 간 뒤 딤으로 닫아도 답은 아쉬웠어요로 남는다', () => {
    markTalkCompleted('scenario');
    render(<SatisfactionGate moment="scenario" />);
    fireEvent.click(screen.getByText(/아쉬웠어요/));

    fireEvent.click(screen.getByTestId('bottom-sheet-dim'));

    expect(readSatisfactionAnswer('scenario')).toBe('bad');
    expect(trackMock).not.toHaveBeenCalledWith('Satisfaction Prompt Answered', {
      moment: 'scenario',
      answer: 'dismiss',
    });
  });
});

describe('SatisfactionGate — 리뷰 요청(review)', () => {
  it('묻는 단계 없이 별점판으로 바로 열리고, 몇 번째 노출인지와 무엇을 마치고 왔는지를 계측한다', () => {
    markTalkCompleted('scenario');

    render(<SatisfactionGate moment="review" />);

    expect(screen.getByText('잘 써주셔서 감사해요!')).toBeInTheDocument();
    expect(screen.getByText('리뷰 남기러 가기')).toBeInTheDocument();
    expect(trackMock).toHaveBeenCalledWith('Satisfaction Prompt Viewed', {
      moment: 'review',
      attempt: 1,
      trigger: 'talk',
    });
  });

  it('표현 학습을 마치고 왔으면 trigger가 expression이다', () => {
    markExpressionCompleted();

    render(<SatisfactionGate moment="review" />);

    expect(trackMock).toHaveBeenCalledWith('Satisfaction Prompt Viewed', {
      moment: 'review',
      attempt: 1,
      trigger: 'expression',
    });
  });

  it('같은 날 다시 마운트돼도 횟수·계측이 더 늘지 않는다 — 할인 시트에 밀렸다 돌아온 경우', () => {
    markTalkCompleted('scenario');
    const { unmount } = render(<SatisfactionGate moment="review" />);
    unmount();

    render(<SatisfactionGate moment="review" />);

    expect(readReviewAttempt()).toBe(1);
    expect(screen.queryByText('이미 남겼어요')).not.toBeInTheDocument();
    expect(
      trackMock.mock.calls.filter(
        ([name, props]) =>
          name === 'Satisfaction Prompt Viewed' &&
          (props as { moment: string }).moment === 'review',
      ),
    ).toHaveLength(1);
  });

  it('뜨면 횟수를 올리고 쌓여 있던 차례를 모두 소비한다 — 닫자마자 다른 시트가 이어 뜨지 않게', () => {
    markTalkCompleted('scenario');
    markTalkCompleted('smalltalk');

    render(<SatisfactionGate moment="review" />);

    expect(readReviewAttempt()).toBe(1);
    expect(shouldAskSatisfaction('scenario')).toBe(false);
    expect(shouldAskSatisfaction('smalltalk')).toBe(false);
  });

  // 카드를 아는 셸(브릿지 9)과 모르는 셸(8)
  const shell = (bridgeVersion: number) =>
    ({
      platform: 'ios',
      appVersion: '1.4.0',
      buildNumber: '20',
      bridgeVersion,
    }) as ReturnType<typeof getNativeContext>;
  const stubLocation = () =>
    vi
      .spyOn(window, 'location', 'get')
      .mockReturnValue({ href: '' } as Location);

  it('카드를 모르는 셸에서 리뷰 남기러 가기를 누르면 바로 스토어를 연다', () => {
    getNativeContextMock.mockReturnValue(shell(8));
    const location = stubLocation();
    render(<SatisfactionGate moment="review" />);

    fireEvent.click(screen.getByText('리뷰 남기러 가기'));

    expect(readSatisfactionAnswer('review')).toBe('good');
    expect(requestReviewCardMock).not.toHaveBeenCalled();
    expect(trackMock).toHaveBeenCalledWith('Review Store Opened', {
      store: 'app_store',
    });
    location.mockRestore();
  });

  it('카드를 아는 셸에서 카드가 뜨면 시트만 닫고 스토어로 보내지 않는다', async () => {
    getNativeContextMock.mockReturnValue(shell(9));
    requestReviewCardMock.mockResolvedValue({
      type: 'REVIEW_RESULT',
      status: 'shown',
    });
    const location = stubLocation();
    render(<SatisfactionGate moment="review" />);

    fireEvent.click(screen.getByText('리뷰 남기러 가기'));
    await act(async () => {});

    expect(trackMock).toHaveBeenCalledWith('Review Card Requested', {
      status: 'shown',
    });
    expect(trackMock).not.toHaveBeenCalledWith(
      'Review Store Opened',
      expect.anything(),
    );
    expect(screen.queryByText('잘 써주셔서 감사해요!')).not.toBeInTheDocument();
    expect(readSatisfactionAnswer('review')).toBe('good');
    location.mockRestore();
  });

  it.each([['not_shown'], ['unavailable']] as const)(
    '카드가 안 뜨면(%s) 스토어로 보낸다',
    async (status) => {
      getNativeContextMock.mockReturnValue(shell(9));
      requestReviewCardMock.mockResolvedValue({
        type: 'REVIEW_RESULT',
        status,
      });
      const location = stubLocation();
      render(<SatisfactionGate moment="review" />);

      fireEvent.click(screen.getByText('리뷰 남기러 가기'));
      await act(async () => {});

      expect(trackMock).toHaveBeenCalledWith('Review Card Requested', {
        status,
      });
      expect(trackMock).toHaveBeenCalledWith('Review Store Opened', {
        store: 'app_store',
      });
      location.mockRestore();
    },
  );

  it('셸이 답을 안 주면 timeout으로 남기고 스토어로 보낸다', async () => {
    getNativeContextMock.mockReturnValue(shell(9));
    requestReviewCardMock.mockResolvedValue(null);
    const location = stubLocation();
    render(<SatisfactionGate moment="review" />);

    fireEvent.click(screen.getByText('리뷰 남기러 가기'));
    await act(async () => {});

    expect(trackMock).toHaveBeenCalledWith('Review Card Requested', {
      status: 'timeout',
    });
    expect(trackMock).toHaveBeenCalledWith('Review Store Opened', {
      store: 'app_store',
    });
    location.mockRestore();
  });

  it('카드 회신을 기다리는 동안 버튼은 잠긴다 — 연타해도 요청은 한 번', async () => {
    getNativeContextMock.mockReturnValue(shell(9));
    let resolve: (value: {
      type: 'REVIEW_RESULT';
      status: 'shown';
    }) => void = () => {};
    requestReviewCardMock.mockReturnValue(
      new Promise((r) => {
        resolve = r;
      }),
    );
    render(<SatisfactionGate moment="review" />);

    fireEvent.click(screen.getByText('리뷰 남기러 가기'));
    fireEvent.click(screen.getByText('리뷰 남기러 가기'));

    expect(
      screen.getByText('리뷰 남기러 가기').closest('button'),
    ).toBeDisabled();
    expect(requestReviewCardMock).toHaveBeenCalledTimes(1);
    await act(async () => {
      resolve({ type: 'REVIEW_RESULT', status: 'shown' });
    });
  });

  it('카드 회신을 기다리는 동안 딤으로 닫으면 무시한다 — 닫은 사람을 회신 뒤 스토어로 보내지 않게', async () => {
    getNativeContextMock.mockReturnValue(shell(9));
    let resolve: (value: {
      type: 'REVIEW_RESULT';
      status: 'not_shown';
    }) => void = () => {};
    requestReviewCardMock.mockReturnValue(
      new Promise((r) => {
        resolve = r;
      }),
    );
    const location = stubLocation();
    render(<SatisfactionGate moment="review" />);
    fireEvent.click(screen.getByText('리뷰 남기러 가기'));

    fireEvent.click(screen.getByTestId('bottom-sheet-dim'));

    expect(readSatisfactionAnswer('review')).toBe('good');
    await act(async () => {
      resolve({ type: 'REVIEW_RESULT', status: 'not_shown' });
    });
    expect(trackMock).toHaveBeenCalledWith('Review Store Opened', {
      store: 'app_store',
    });
    location.mockRestore();
  });

  it('카드 회신을 기다리는 사이 화면이 사라지면 요청을 끊고 스토어를 열지 않는다', async () => {
    getNativeContextMock.mockReturnValue(shell(9));
    requestReviewCardMock.mockImplementation(
      (signal) =>
        new Promise((r) => {
          signal?.addEventListener('abort', () => r(null));
        }),
    );
    const location = stubLocation();
    const { unmount } = render(<SatisfactionGate moment="review" />);
    fireEvent.click(screen.getByText('리뷰 남기러 가기'));

    unmount();
    await act(async () => {});

    expect(requestReviewCardMock.mock.calls[0][0]?.aborted).toBe(true);
    expect(trackMock).not.toHaveBeenCalledWith(
      'Review Card Requested',
      expect.anything(),
    );
    expect(trackMock).not.toHaveBeenCalledWith(
      'Review Store Opened',
      expect.anything(),
    );
    location.mockRestore();
  });

  it('딤으로 닫으면 dismiss로 남긴다 — 간격을 두고 다시 청하는 근거', () => {
    render(<SatisfactionGate moment="review" />);

    fireEvent.click(screen.getByTestId('bottom-sheet-dim'));

    expect(readSatisfactionAnswer('review')).toBe('dismiss');
    expect(screen.queryByText('잘 써주셔서 감사해요!')).not.toBeInTheDocument();
  });

  it('X 버튼으로 닫아도 딤과 같다', () => {
    render(<SatisfactionGate moment="review" />);

    fireEvent.click(screen.getByLabelText('닫기'));

    expect(readSatisfactionAnswer('review')).toBe('dismiss');
    expect(trackMock).toHaveBeenCalledWith('Satisfaction Prompt Answered', {
      moment: 'review',
      answer: 'dismiss',
    });
  });

  it('처음 뜰 때는 「이미 남겼어요」가 없다 — 아직 남겼을 리 없다', () => {
    render(<SatisfactionGate moment="review" />);

    expect(screen.queryByText('이미 남겼어요')).not.toBeInTheDocument();
  });

  it('재요청부터 「이미 남겼어요」가 보이고, 누르면 다시 청하지 않는다', () => {
    // Given 지난날 한 번 띄웠다 닫은 적이 있고, 좋았다고 한 사람이 오늘 또 대화를 마쳤다
    markTalkCompleted('scenario');
    recordSatisfactionAnswer('scenario', 'good');
    markReviewShown();
    recordSatisfactionAnswer('review', 'dismiss');
    const all = JSON.parse(localStorage.getItem(PROMPT_RECORD_KEY)!);
    all['satisfaction:review'].shownOn = '2000-01-01';
    all['satisfaction:review'].answeredOn = '2000-01-01';
    localStorage.setItem(PROMPT_RECORD_KEY, JSON.stringify(all));
    markTalkCompleted('scenario');

    // When 재요청 시트에서 이미 남겼다고 하면
    render(<SatisfactionGate moment="review" />);
    fireEvent.click(screen.getByText('이미 남겼어요'));

    // Then 그 답을 남기고 시트가 닫히며, 또 마쳐도 청하지 않는다
    expect(readSatisfactionAnswer('review')).toBe('already_done');
    expect(trackMock).toHaveBeenCalledWith('Satisfaction Prompt Answered', {
      moment: 'review',
      answer: 'already_done',
    });
    expect(screen.queryByText('잘 써주셔서 감사해요!')).not.toBeInTheDocument();
    markTalkCompleted('scenario');
    expect(shouldAskReview()).toBe(false);
  });
});
