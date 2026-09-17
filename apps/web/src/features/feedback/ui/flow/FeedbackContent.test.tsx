// 피드백 본편의 단계 전환 — 상세는 열려 있을 때만 들어가고, 잠겼으면 호출부에 맡긴다
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import type {
  MessageFeedbackResponse,
  SessionFeedbackResponse,
} from '../../api/session-feedback';
import { FeedbackContent } from './FeedbackContent';

const mocks = vi.hoisted(() => ({ track: vi.fn() }));
vi.mock('@/shared/analytics', () => ({ track: mocks.track }));
// 총평·상세 화면은 자기 몫이 따로 있다 — 여기선 단계가 어떻게 바뀌는지만 본다
vi.mock('./FeedbackSummary', () => ({
  FeedbackSummary: ({ onDetail }: { onDetail: () => void }) => (
    <button onClick={onDetail}>상세 보기</button>
  ),
}));
vi.mock('./FeedbackDetail', () => ({
  FeedbackDetail: () => <p>상세 화면</p>,
}));

const turn = {
  messageFeedbackId: 1,
  feedbackType: 'GOOD',
} as MessageFeedbackResponse;

const feedback = (
  overrides: Partial<SessionFeedbackResponse> = {},
): SessionFeedbackResponse => ({
  sessionId: 7,
  nativeScore: 80,
  starRating: 4,
  highlightMessage: '',
  summaryMessage: '',
  messageFeedbacks: [],
  ...overrides,
});

afterEach(() => {
  cleanup();
  mocks.track.mockReset();
});

describe('FeedbackContent', () => {
  it('열린 세션은 상세 보기를 누르면 상세로 넘어가고 열었다고 남긴다', () => {
    render(
      <FeedbackContent
        feedback={feedback({
          detailFeedbackLocked: false,
          messageFeedbacks: [turn],
        })}
        title="카페"
        onExit={vi.fn()}
        onDetailLocked={vi.fn()}
      />,
    );

    fireEvent.click(screen.getByText('상세 보기'));

    expect(screen.getByText('상세 화면')).toBeInTheDocument();
    expect(mocks.track).toHaveBeenCalledWith('Feedback Detail Opened', {
      session_id: 7,
    });
  });

  it('서버가 잠근 세션은 상세로 넘어가지 않고 호출부에 맡긴다', () => {
    // Given 두 번째 시나리오라 서버가 상세를 비워 보낸 세션
    const onDetailLocked = vi.fn();
    render(
      <FeedbackContent
        feedback={feedback({ detailFeedbackLocked: true })}
        title="카페"
        onExit={vi.fn()}
        onDetailLocked={onDetailLocked}
      />,
    );

    // When 상세 보기를 누르면
    fireEvent.click(screen.getByText('상세 보기'));

    // Then 상세 화면 대신 잠김 처리(페이월)로 넘긴다
    expect(onDetailLocked).toHaveBeenCalledTimes(1);
    expect(screen.queryByText('상세 화면')).not.toBeInTheDocument();
    expect(mocks.track).not.toHaveBeenCalledWith(
      'Feedback Detail Opened',
      expect.anything(),
    );
  });

  it('노출 계측에 잠금 여부를 실어 턴 수 0을 잠금과 같이 읽게 한다', () => {
    render(
      <FeedbackContent
        feedback={feedback({ detailFeedbackLocked: true })}
        title="카페"
        onExit={vi.fn()}
        onDetailLocked={vi.fn()}
      />,
    );

    expect(mocks.track).toHaveBeenCalledWith(
      'Feedback Viewed',
      expect.objectContaining({ detail_locked: true, turn_count: 0 }),
    );
  });

  it('결제하고 돌아온 길이면 총평을 건너뛰고 상세부터 연다', () => {
    render(
      <FeedbackContent
        feedback={feedback({
          detailFeedbackLocked: false,
          messageFeedbacks: [turn],
        })}
        title="카페"
        openDetail
        onExit={vi.fn()}
        onDetailLocked={vi.fn()}
      />,
    );

    expect(screen.getByText('상세 화면')).toBeInTheDocument();
  });

  it('돌아온 순간엔 잠긴 옛 응답이고, 풀린 응답이 뒤늦게 오면 그때 상세를 연다', () => {
    // Given 결제하고 돌아왔지만 캐시는 아직 무료일 때 받은 잠긴 응답일 때
    const { rerender } = render(
      <FeedbackContent
        feedback={feedback({ detailFeedbackLocked: true })}
        title="카페"
        openDetail
        onExit={vi.fn()}
        onDetailLocked={vi.fn()}
      />,
    );
    expect(screen.getByText('상세 보기')).toBeInTheDocument();

    // When 다시 받은 응답이 잠금이 풀려 오면
    rerender(
      <FeedbackContent
        feedback={feedback({
          detailFeedbackLocked: false,
          messageFeedbacks: [turn],
        })}
        title="카페"
        openDetail
        onExit={vi.fn()}
        onDetailLocked={vi.fn()}
      />,
    );

    // Then 그제야 상세로 들어가고, 클릭으로 연 것과 같이 계측에 남는다
    expect(screen.getByText('상세 화면')).toBeInTheDocument();
    expect(mocks.track).toHaveBeenCalledWith('Feedback Detail Opened', {
      session_id: 7,
    });
  });

  it('총평에 머무는 동안에는 상세를 열었다고 남기지 않는다', () => {
    // Given 결제하고 돌아왔지만 응답이 아직 잠겨 있을 때
    render(
      <FeedbackContent
        feedback={feedback({ detailFeedbackLocked: true })}
        title="카페"
        openDetail
        onExit={vi.fn()}
        onDetailLocked={vi.fn()}
      />,
    );

    // Then 상세를 연 적이 없으니 계측도 없다
    expect(mocks.track).not.toHaveBeenCalledWith(
      'Feedback Detail Opened',
      expect.anything(),
    );
  });

  it('돌아왔는데 끝내 잠겨 있으면(서버 반영 지연) 총평에 머문다', () => {
    render(
      <FeedbackContent
        feedback={feedback({ detailFeedbackLocked: true })}
        title="카페"
        openDetail
        onExit={vi.fn()}
        onDetailLocked={vi.fn()}
      />,
    );

    expect(screen.getByText('상세 보기')).toBeInTheDocument();
  });

  it('잠긴 응답을 다시 받는 중에 상세 보기를 누르면 페이월로 보내지 않는다 — 방금 결제한 사람이다', () => {
    const onDetailLocked = vi.fn();
    render(
      <FeedbackContent
        feedback={feedback({ detailFeedbackLocked: true })}
        title="카페"
        refreshing
        onExit={vi.fn()}
        onDetailLocked={onDetailLocked}
      />,
    );

    fireEvent.click(screen.getByText('상세 보기'));

    expect(onDetailLocked).not.toHaveBeenCalled();
  });

  it('열려 있는데 볼 턴이 없으면 상세 없이 마친 것으로 본다 — 빈 상세 화면은 없다', () => {
    const onExit = vi.fn();
    render(
      <FeedbackContent
        feedback={feedback({ detailFeedbackLocked: false })}
        title="카페"
        onExit={onExit}
        onDetailLocked={vi.fn()}
      />,
    );

    fireEvent.click(screen.getByText('상세 보기'));

    expect(onExit).toHaveBeenCalledTimes(1);
    expect(screen.queryByText('상세 화면')).not.toBeInTheDocument();
  });

  it('구버전 응답(잠금 필드 없음)은 열린 것으로 본다', () => {
    render(
      <FeedbackContent
        feedback={feedback({ messageFeedbacks: [turn] })}
        title="카페"
        onExit={vi.fn()}
        onDetailLocked={vi.fn()}
      />,
    );

    fireEvent.click(screen.getByText('상세 보기'));

    expect(screen.getByText('상세 화면')).toBeInTheDocument();
  });
});
