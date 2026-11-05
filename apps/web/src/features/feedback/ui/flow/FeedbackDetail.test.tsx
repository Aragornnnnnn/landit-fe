// 피드백 상세 한 장의 경계 — 과거 회차는 평가 문맥(질문·상황)이 비어 올 수 있다
import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
} from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { runBackPress } from '@/shared/bridge/back-press';

import type { MessageFeedbackResponse } from '../../api/session-feedback';
import { FeedbackDetail } from './FeedbackDetail';

vi.mock('@/shared/analytics', () => ({ track: vi.fn() }));

const turn = (
  overrides: Partial<MessageFeedbackResponse> = {},
): MessageFeedbackResponse => ({
  messageFeedbackId: 1,
  messageId: 10,
  turnNumber: 1,
  userMessage: 'I want a coffee.',
  evaluationContext: {
    type: 'AI_MESSAGE',
    content: 'What would you like?',
    translatedContent: '무엇을 드릴까요?',
  },
  feedbackType: 'GOOD',
  baseLocaleAnalogy: null,
  positiveFeedback: '잘 전달했어요',
  feedbackDetail: null,
  correctionExpression: null,
  correctionReason: null,
  benchmarkMessage: null,
  ...overrides,
});

afterEach(() => cleanup());

describe('FeedbackDetail', () => {
  it('평가 문맥이 있으면 질문과 번역을 내 답변 위에 보인다', () => {
    render(
      <FeedbackDetail
        sessionId={7}
        source="history"
        turns={[turn()]}
        onBack={vi.fn()}
        onDone={vi.fn()}
      />,
    );

    expect(screen.getByText('What would you like?')).toBeInTheDocument();
    expect(screen.getByText('I want a coffee.')).toBeInTheDocument();
  });

  it('과거 회차라 평가 문맥이 비어 오면 문맥 말풍선 없이 내 답변만 보인다', () => {
    // Given 기록 API가 당시 문맥을 복원하지 못한 회차 (evaluationContext: null)
    render(
      <FeedbackDetail
        sessionId={7}
        source="history"
        turns={[turn({ evaluationContext: null })]}
        onBack={vi.fn()}
        onDone={vi.fn()}
      />,
    );

    // Then 화면이 깨지지 않고 내 답변이 남는다
    expect(screen.getByText('I want a coffee.')).toBeInTheDocument();
    expect(screen.queryByText('질문')).not.toBeInTheDocument();
  });
});

describe('FeedbackDetail 안드로이드 뒤로가기', () => {
  const renderTwoTurns = (onBack: () => void) =>
    render(
      <FeedbackDetail
        sessionId={7}
        source="history"
        turns={[
          turn(),
          turn({ messageFeedbackId: 2, userMessage: 'Second answer.' }),
        ]}
        onBack={onBack}
        onDone={vi.fn()}
      />,
    );

  it('둘째 장에서 뒤로가기를 누르면 앞 장으로 돌아온다', () => {
    // Given 두 번째 장을 보고 있다
    const onBack = vi.fn();
    renderTwoTurns(onBack);
    fireEvent.click(screen.getByRole('button', { name: /다음/ }));

    // When 뒤로가기를 누르면
    act(() => void runBackPress());

    // Then 첫 장으로 돌아오고 상세는 그대로다
    expect(screen.getByText('I want a coffee.')).toBeInTheDocument();
    expect(onBack).not.toHaveBeenCalled();
  });

  it('첫 장에서 뒤로가기를 누르면 상세를 벗어난다', () => {
    // Given 첫 장을 보고 있다
    const onBack = vi.fn();
    renderTwoTurns(onBack);

    // When 뒤로가기를 누르면
    act(() => void runBackPress());

    // Then 상세를 벗어난다
    expect(onBack).toHaveBeenCalledTimes(1);
  });
});
