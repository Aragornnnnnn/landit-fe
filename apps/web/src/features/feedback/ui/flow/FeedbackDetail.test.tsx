// 피드백 상세 한 장의 경계 — 과거 회차는 평가 문맥(질문·상황)이 비어 올 수 있다
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

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
