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

import {
  markTalkCompleted,
  readSatisfactionAnswer,
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

const replace = vi.fn();
vi.mock('next/navigation', () => ({ useRouter: () => ({ replace }) }));

beforeEach(() => {
  localStorage.clear();
  vi.useFakeTimers();
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
  it('묻는 단계 없이 별점판으로 바로 열린다', () => {
    render(<SatisfactionGate moment="review" />);

    expect(screen.getByText('잘 써주셔서 감사해요!')).toBeInTheDocument();
    expect(screen.getByText('응원 남기러 가기')).toBeInTheDocument();
    expect(trackMock).toHaveBeenCalledWith('Satisfaction Prompt Viewed', {
      moment: 'review',
    });
  });

  it('뜨면 쌓여 있던 차례를 모두 소비한다 — 닫자마자 다른 시트가 이어 뜨지 않게', () => {
    markTalkCompleted('scenario');
    markTalkCompleted('smalltalk');

    render(<SatisfactionGate moment="review" />);

    expect(shouldAskSatisfaction('scenario')).toBe(false);
    expect(shouldAskSatisfaction('smalltalk')).toBe(false);
  });

  it('응원 남기러 가기를 누르면 스토어를 연다', () => {
    getNativeContextMock.mockReturnValue({
      platform: 'ios',
    } as ReturnType<typeof getNativeContext>);
    const location = vi
      .spyOn(window, 'location', 'get')
      .mockReturnValue({ href: '' } as Location);
    render(<SatisfactionGate moment="review" />);

    fireEvent.click(screen.getByText('응원 남기러 가기'));

    expect(readSatisfactionAnswer('review')).toBe('good');
    expect(trackMock).toHaveBeenCalledWith('Review Store Opened', {
      store: 'app_store',
    });
    location.mockRestore();
  });

  it('딤으로 닫으면 dismiss로 남겨 다시 청하지 않는다', () => {
    render(<SatisfactionGate moment="review" />);

    fireEvent.click(screen.getByTestId('bottom-sheet-dim'));

    expect(readSatisfactionAnswer('review')).toBe('dismiss');
    expect(screen.queryByText('잘 써주셔서 감사해요!')).not.toBeInTheDocument();
  });
});
