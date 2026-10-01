// 총평 화면 구성 — 헤드라인·성공률·총평, 영역 점수 카드, 성장·배운 표현 카드의 있음·없음·분석 중, 잠긴 세션의 CTA
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
  within,
} from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import type {
  SessionLevelAssessment,
  SessionLevelAssessmentResponse,
} from '../../api/level-assessment';
import type {
  MessageFeedbackResponse,
  ScenarioGrowthCard,
  SessionFeedbackResponse,
} from '../../api/session-feedback';
import { LOCKED_DETAIL_CTA_LABEL } from '../../model/feedback-view';
import { FeedbackSummary } from './FeedbackSummary';

const mocks = vi.hoisted(() => ({ getLevelAssessment: vi.fn() }));
vi.mock('../../api/level-assessment', () => ({
  getLevelAssessment: mocks.getLevelAssessment,
}));
// 별점·점수 트랙은 자기 테스트가 있다 — 여기선 문구와 카드 구성만 본다
vi.mock('@/shared/ui/StarRating', () => ({ StarRating: () => <span /> }));
vi.mock('./ScoreTrack', () => ({ ScoreTrack: () => <span /> }));

const turn = (feedbackType: 'GOOD' | 'NEEDS_IMPROVEMENT') =>
  ({ messageFeedbackId: 1, feedbackType }) as MessageFeedbackResponse;

const domain = (score: number | null) => ({ score, confidence: 0.9 });

const assessment: SessionLevelAssessment = {
  situationPerformance: domain(5),
  grammar: domain(1.15),
  vocabulary: domain(0.9),
  discourse: domain(1.15),
  interactionPragmatics: domain(1.15),
  assessedScore: 2,
  assessedLevel: 2,
  sufficientEvidence: true,
  source: 'MODEL',
  changeType: 'INITIALIZED',
  previousLevel: null,
  currentLevel: 2,
  displayLevel: 2,
  details: { strength: null, improvement: '상대의 말에 반응해 봐요' },
  assessmentVersion: 'v1',
};

const levelResponse = (
  processingStatus: SessionLevelAssessmentResponse['processingStatus'],
  levelAssessment: SessionLevelAssessment | null = null,
): SessionLevelAssessmentResponse => ({
  sessionId: 7,
  processingStatus,
  levelAssessment,
});

const growth: ScenarioGrowthCard = {
  pattern: 'PAST_TENSE',
  patternLabel: '과거형',
  succeeded: true,
  previousDate: '2026-09-29',
  previousSentence: 'I go there yesterday.',
  previousWrongSpan: 'go',
  currentSentence: 'I went there.',
  currentSpan: 'went',
};

const feedback = (
  overrides: Partial<SessionFeedbackResponse> = {},
): SessionFeedbackResponse => ({
  sessionId: 7,
  nativeScore: 53,
  starRating: 1,
  highlightMessage: '앞으로 해외에서 혼자서도 유심을 살 수 있어요!',
  summaryMessage: '이름과 취미를 모두 답하려는 시도는 좋았어요.',
  messageFeedbacks: [turn('GOOD'), turn('NEEDS_IMPROVEMENT')],
  detailFeedbackLocked: false,
  userLevelAssessment: null,
  growthFeedback: null,
  expressionReuse: { pending: false, items: [] },
  ...overrides,
});

const renderSummary = (
  value: SessionFeedbackResponse,
  { detailLocked = false, onDetail = vi.fn() } = {},
) =>
  render(
    <QueryClientProvider client={new QueryClient()}>
      <FeedbackSummary
        feedback={value}
        title="카페"
        detailLocked={detailLocked}
        onBack={vi.fn()}
        onDetail={onDetail}
      />
    </QueryClientProvider>,
  );

afterEach(() => {
  cleanup();
  mocks.getLevelAssessment.mockReset();
});

describe('FeedbackSummary', () => {
  it('헤드라인은 서버가 별점에 맞춰 준 문구를 그대로 쓰고, 총평 카드에 요약을 담는다', () => {
    renderSummary(feedback());

    expect(
      screen.getByText('앞으로 해외에서 혼자서도 유심을 살 수 있어요!'),
    ).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: '총평' })).toBeInTheDocument();
    expect(
      screen.getByText('이름과 취미를 모두 답하려는 시도는 좋았어요.'),
    ).toBeInTheDocument();
  });

  it('열린 세션은 성공률을 세고 남은 걸음 수로 상세를 권한다', () => {
    renderSummary(feedback());

    expect(screen.getByText(/원어민처럼 말했어요/)).toHaveTextContent(
      '2번 중 1번 원어민처럼 말했어요',
    );
    expect(
      screen.getByText('원어민까지 1걸음, 고쳐볼게요'),
    ).toBeInTheDocument();
  });

  it('잠긴 세션은 성공률 줄을 빼고 CTA를 잠긴 문구로 바꾼다 — 턴별 피드백이 비어 와서 셀 수 없다', () => {
    // Given 두 번째 시나리오라 서버가 상세를 비워 보낸 세션
    const onDetail = vi.fn();
    renderSummary(
      feedback({ messageFeedbacks: [], detailFeedbackLocked: true }),
      { detailLocked: true, onDetail },
    );

    // Then 0번 중 0번 같은 문구가 나가지 않고, CTA는 잠긴 문구다
    expect(screen.queryByText(/원어민처럼 말했어요/)).not.toBeInTheDocument();
    expect(screen.queryByText(/걸음/)).not.toBeInTheDocument();

    // When 그 CTA를 누르면 호출부가 페이월로 보낼 수 있게 그대로 알린다
    fireEvent.click(screen.getByText(LOCKED_DETAIL_CTA_LABEL));
    expect(onDetail).toHaveBeenCalledTimes(1);
  });

  it('끝난 수준 평가가 실려 오면 영역 다섯 줄과 개선할 점을 보인다', () => {
    renderSummary(
      feedback({
        userLevelAssessment: levelResponse('COMPLETED', assessment),
      }),
    );

    const card = screen
      .getByRole('heading', { name: '이번 대화에서' })
      .closest('section') as HTMLElement;
    expect(within(card).getByText('상황 대처 능력')).toBeInTheDocument();
    expect(within(card).getByText('100점')).toBeInTheDocument();
    expect(within(card).getByText('18점')).toBeInTheDocument();
    expect(
      within(card).getByText('상대의 말에 반응해 봐요'),
    ).toBeInTheDocument();
  });

  it('(i)를 누르면 영역별 설명이 담긴 점수 설명이 뜬다', () => {
    renderSummary(
      feedback({
        userLevelAssessment: levelResponse('COMPLETED', assessment),
      }),
    );

    fireEvent.click(screen.getByRole('button', { name: '점수 설명' }));

    // Then 영역마다 무엇을 봤는지 함께 읽힌다
    expect(screen.getByRole('tooltip')).toHaveTextContent(
      '대화 매너상대 말에 반응하며 자연스럽게 주고받았는지',
    );
  });

  it('응답 때 분석 중이었으면 로딩을 보이다가 다시 물어 온 결과로 채운다', async () => {
    // Given 총평을 만들 때는 수준 평가가 아직 분석 중이었고, 다시 물으면 끝나 있다
    mocks.getLevelAssessment.mockResolvedValue(
      levelResponse('COMPLETED', assessment),
    );

    renderSummary(
      feedback({ userLevelAssessment: levelResponse('PREPARING') }),
    );

    expect(
      screen.getByRole('status', { name: '이번 대화 점수를 분석하고 있어요' }),
    ).toBeInTheDocument();
    expect(await screen.findByText('상황 대처 능력')).toBeInTheDocument();
  });

  it('분석 중이던 평가가 상한 전에 도착하면, 상한이 지나도 카드를 거두지 않는다', async () => {
    // Given 총평을 만들 때는 분석 중이었고, 다시 물으면 끝나 있다
    vi.useFakeTimers({ shouldAdvanceTime: true });
    mocks.getLevelAssessment.mockResolvedValue(
      levelResponse('COMPLETED', assessment),
    );
    renderSummary(
      feedback({ userLevelAssessment: levelResponse('PREPARING') }),
    );
    expect(await screen.findByText('상황 대처 능력')).toBeInTheDocument();

    // When 20초 상한이 지난다
    await act(() => vi.advanceTimersByTimeAsync(21_000));

    // Then 이미 보여 준 점수 카드는 그대로다
    expect(screen.getByText('상황 대처 능력')).toBeInTheDocument();
    vi.useRealTimers();
  });

  it('평가 비활성 세션이면 영역 점수 카드를 그리지 않는다', () => {
    renderSummary(feedback({ userLevelAssessment: null }));

    expect(
      screen.queryByRole('heading', { name: '이번 대화에서' }),
    ).not.toBeInTheDocument();
  });

  it('비교할 지난 기록이 있으면 성장 카드를 보인다', () => {
    renderSummary(feedback({ growthFeedback: growth }));

    expect(screen.getByText('지난번엔 헷갈렸던 과거형')).toBeInTheDocument();
  });

  it('비교할 지난 기록이 없으면 성장 카드 자리에 빈 문구를 보인다', () => {
    renderSummary(feedback({ growthFeedback: null }));

    expect(screen.getByText('아직 지난 기록이 없어요')).toBeInTheDocument();
  });

  it('다시 쓴 배운 표현이 있으면 목록을 보인다', () => {
    renderSummary(
      feedback({
        expressionReuse: {
          pending: false,
          items: [
            {
              expressionId: 1,
              text: 'used to',
              meaning: '~하곤 했다',
              sourceLabel: '9월 28일 「카페」',
              messageId: 3,
              quotedSentence: 'I used to go there.',
              matchedText: 'used to',
            },
          ],
        },
      }),
    );

    expect(screen.getByText('~하곤 했다')).toBeInTheDocument();
  });

  it('다시 쓴 배운 표현이 없으면 빈 문구를 보인다', () => {
    renderSummary(feedback({ expressionReuse: { pending: false, items: [] } }));

    expect(screen.getByText('아직 배운 표현이 없어요')).toBeInTheDocument();
  });

  it('필드가 없는 구버전 응답이면 성장·배운 표현 카드를 그리지 않는다 — 빈 문구가 거짓이 된다', () => {
    const {
      growthFeedback: _growth,
      expressionReuse: _reuse,
      ...legacy
    } = feedback();

    renderSummary(legacy);

    expect(
      screen.queryByText('아직 지난 기록이 없어요'),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByText('아직 배운 표현이 없어요'),
    ).not.toBeInTheDocument();
  });

  it('배운 표현을 아직 분석 중이면 빈 문구를 띄우지 않는다 — 다시 물을 수 없어 카드를 거둔다', () => {
    renderSummary(feedback({ expressionReuse: { pending: true, items: [] } }));

    expect(
      screen.queryByText('랜딧에서 배운 표현을 실제로 사용했어요'),
    ).not.toBeInTheDocument();
  });
});
