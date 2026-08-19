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
  recordSatisfactionAnswer,
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

const ASK = '첫 대화, 어떠셨나요?';

describe('SatisfactionGate', () => {
  it('대화를 마친 기록이 없으면 아무것도 띄우지 않는다', () => {
    render(<SatisfactionGate moment="scenario" />);

    expect(screen.queryByText(ASK)).not.toBeInTheDocument();
  });

  it('첫 대화를 마치고 왔으면 소감 시트를 띄우고 노출을 계측한다', () => {
    markTalkCompleted('scenario');

    render(<SatisfactionGate moment="scenario" />);

    expect(screen.getByText(ASK)).toBeInTheDocument();
    expect(trackMock).toHaveBeenCalledWith('Satisfaction Prompt Viewed', {
      moment: 'scenario',
    });
  });

  it('이미 답한 적 있으면 다시 띄우지 않는다', () => {
    markTalkCompleted('scenario');
    recordSatisfactionAnswer('scenario', 'dismiss');

    render(<SatisfactionGate moment="scenario" />);

    expect(screen.queryByText(ASK)).not.toBeInTheDocument();
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

  it('첫 소감이 뜨면 이번 완료의 차례를 소비한다 — 같은 완료로 다시 마운트돼도 안 뜬다', () => {
    markTalkCompleted('scenario');
    const { unmount } = render(<SatisfactionGate moment="scenario" />);
    expect(screen.getByText(ASK)).toBeInTheDocument();

    // 답하지 않고 화면을 떠났다가(언마운트) 홈에 다시 온다
    unmount();
    render(<SatisfactionGate moment="scenario" />);

    expect(screen.queryByText(ASK)).not.toBeInTheDocument();
  });
});

describe('SatisfactionGate — 랜딧 소감(app)', () => {
  const ASK_APP = '랜딧, 잘 사용하고 계신가요?';

  it('띄우기로 결정돼 마운트되면 바로 묻고, 시나리오 완료 차례를 소비한다', () => {
    markTalkCompleted('scenario');

    render(<SatisfactionGate moment="app" />);

    expect(screen.getByText(ASK_APP)).toBeInTheDocument();
    expect(trackMock).toHaveBeenCalledWith('Satisfaction Prompt Viewed', {
      moment: 'app',
    });
    // 차례가 소비돼 첫 소감도 이 완료로는 더 뜨지 않는다
    expect(shouldAskSatisfaction('scenario')).toBe(false);
  });

  it('잘 쓰고 있어요를 누르면 별점판으로 바뀌고, 리뷰 남기러 가기는 스토어를 연다', () => {
    getNativeContextMock.mockReturnValue({
      platform: 'ios',
    } as ReturnType<typeof getNativeContext>);
    const assign = vi
      .spyOn(window, 'location', 'get')
      .mockReturnValue({ href: '' } as Location);
    render(<SatisfactionGate moment="app" />);

    fireEvent.click(screen.getByText('잘 쓰고 있어요'));

    expect(screen.getByText('잘 써주셔서 감사해요!')).toBeInTheDocument();
    expect(readSatisfactionAnswer('app')).toBe('good');

    fireEvent.click(screen.getByText('응원 남기러 가기'));

    expect(trackMock).toHaveBeenCalledWith('Review Store Opened', {
      store: 'app_store',
    });
    assign.mockRestore();
  });

  it('아쉬워요를 누르면 랜딧용 피드백 안내로 바뀐다', () => {
    render(<SatisfactionGate moment="app" />);

    fireEvent.click(screen.getByText('아쉬워요'));

    expect(screen.getByText('어떤 부분이 아쉬우셨나요?')).toBeInTheDocument();
    expect(readSatisfactionAnswer('app')).toBe('bad');
  });
});
