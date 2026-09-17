// 총평 화면의 잠김 표시 — 서버가 상세를 잠근 세션은 성공률을 세지 않고 CTA가 잠긴 문구로 바뀐다
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import type {
  MessageFeedbackResponse,
  SessionFeedbackResponse,
} from '../../api/session-feedback';
import { LOCKED_DETAIL_CTA_LABEL } from '../../model/feedback-view';
import { FeedbackSummary } from './FeedbackSummary';

// 별점·점수 트랙은 자기 테스트가 있다 — 여기선 문구와 행 구성만 본다
vi.mock('@/shared/ui/StarRating', () => ({ StarRating: () => <span /> }));
vi.mock('./ScoreTrack', () => ({ ScoreTrack: () => <span /> }));

const turn = (feedbackType: 'GOOD' | 'NEEDS_IMPROVEMENT') =>
  ({ messageFeedbackId: 1, feedbackType }) as MessageFeedbackResponse;

const feedback = (
  overrides: Partial<SessionFeedbackResponse> = {},
): SessionFeedbackResponse => ({
  sessionId: 7,
  nativeScore: 80,
  starRating: 4,
  highlightMessage: '',
  summaryMessage: '잘 전달했어요',
  messageFeedbacks: [turn('GOOD'), turn('NEEDS_IMPROVEMENT')],
  ...overrides,
});

afterEach(() => cleanup());

describe('FeedbackSummary', () => {
  it('열린 세션은 성공률을 세고 남은 걸음 수로 상세를 권한다', () => {
    render(
      <FeedbackSummary
        feedback={feedback({ detailFeedbackLocked: false })}
        title="카페"
        detailLocked={false}
        onBack={vi.fn()}
        onDetail={vi.fn()}
      />,
    );

    expect(screen.getByText('대화 성공률')).toBeInTheDocument();
    expect(
      screen.getByText('원어민까지 1걸음, 고쳐볼게요'),
    ).toBeInTheDocument();
  });

  it('잠긴 세션은 성공률 행을 빼고 CTA를 잠긴 문구로 바꾼다 — 턴별 피드백이 비어 와서 셀 수 없다', () => {
    // Given 두 번째 시나리오라 서버가 상세를 비워 보낸 세션
    const onDetail = vi.fn();
    render(
      <FeedbackSummary
        feedback={feedback({
          messageFeedbacks: [],
          detailFeedbackLocked: true,
        })}
        title="카페"
        detailLocked
        onBack={vi.fn()}
        onDetail={onDetail}
      />,
    );

    // Then 0번 중 0번 같은 문구가 나가지 않고, CTA는 잠긴 문구다
    expect(screen.queryByText('대화 성공률')).not.toBeInTheDocument();
    expect(screen.queryByText(/걸음/)).not.toBeInTheDocument();

    // When 그 CTA를 누르면 호출부가 페이월로 보낼 수 있게 그대로 알린다
    fireEvent.click(screen.getByText(LOCKED_DETAIL_CTA_LABEL));
    expect(onDetail).toHaveBeenCalledTimes(1);
  });
});
