// 예문 워터폴 제거 배선 검증(프리페치·preload) + 발음 스텝 게이트 검증
import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { preload } from 'react-dom';
import { afterEach, describe, expect, it, vi } from 'vitest';

import type { ExpressionLearning } from '../api/learning';
import type { ExpressionPractice } from '../api/practice';
import { useExpressionLearningQuery } from '../model/useExpressionLearningQuery';
import { useExpressionPracticeQuery } from '../model/useExpressionPracticeQuery';
import { ExpressionFlow } from './ExpressionFlow';

// preload만 스파이로 바꾸고 나머지 react-dom(렌더러가 씀)은 원본 유지
vi.mock('react-dom', async (importOriginal) => ({
  ...(await importOriginal<typeof import('react-dom')>()),
  preload: vi.fn(),
}));
vi.mock('next/navigation', () => ({ useRouter: () => ({ push: vi.fn() }) }));
vi.mock('../model/useExpressionLearningQuery', () => ({
  useExpressionLearningQuery: vi.fn(),
}));
vi.mock('../model/useExpressionPracticeQuery', () => ({
  useExpressionPracticeQuery: vi.fn(),
}));
vi.mock('../model/useFinishExpressionMutation', () => ({
  useFinishExpressionMutation: () => ({ mutate: vi.fn(), isPending: false }),
}));
// 스텝 UI는 이 테스트 관심사가 아니라 스텁으로 대체(무거운 하위 의존 회피).
// 전환 검증용으로 onNext·onSkip만 버튼으로 노출한다
vi.mock('./learning/QuizStep', () => ({
  QuizStep: ({
    step,
    partner,
    onNext,
    onBack,
  }: {
    step: string;
    partner: string;
    onNext: () => void;
    onBack: () => void;
  }) => (
    <div>
      <p>quiz:{step}</p>
      <p>partner:{partner}</p>
      <button onClick={onNext}>quiz-next</button>
      <button onClick={onBack}>quiz-back</button>
    </div>
  ),
}));
vi.mock('./learning/ExplanationStep', () => ({
  ExplanationStep: ({
    nextLabel,
    examples,
    onNext,
    onBack,
  }: {
    nextLabel: string;
    examples: unknown[];
    onNext: () => void;
    onBack: () => void;
  }) => (
    <div>
      <p>
        explain:{nextLabel}:{examples.length}
      </p>
      <button onClick={onNext}>explain-next</button>
      <button onClick={onBack}>explain-back</button>
    </div>
  ),
}));
vi.mock('./learning/ExpressionIntroStep', () => ({
  ExpressionIntroStep: ({
    onNext,
    nextLabel = '소리 내서 말해볼게요',
    onSkip,
  }: {
    onNext: () => void;
    nextLabel?: string;
    onSkip?: () => void;
  }) => (
    <div>
      <p>intro:{nextLabel}</p>
      <button onClick={onNext}>intro-next</button>
      {onSkip && <button onClick={onSkip}>intro-skip</button>}
    </div>
  ),
}));
// 마운트 식별자를 함께 렌더 — 설명으로 나갔다 와도 리마운트(상태 소실)되지 않는지 본다
vi.mock('./pronunciation/PronunciationStep', async () => {
  const { useState } = await import('react');
  let mountSeq = 0;
  return {
    PronunciationStep: ({
      onNext,
      onBack,
      onSettled,
      onUnavailable,
    }: {
      onNext: () => void;
      onBack: () => void;
      onSettled?: () => void;
      onUnavailable: () => void;
    }) => {
      const [mountId] = useState(() => ++mountSeq);
      return (
        <div>
          <p>pronounce#{mountId}</p>
          <button onClick={onNext}>pronounce-next</button>
          <button onClick={onBack}>pronounce-back</button>
          <button onClick={onSettled}>pronounce-settled</button>
          <button onClick={onUnavailable}>pronounce-unavailable</button>
        </div>
      );
    },
  };
});
vi.mock('./common/ExpressionExitSheet', () => ({
  ExpressionExitSheet: () => null,
}));

const learningMock = vi.mocked(useExpressionLearningQuery);
const practiceMock = vi.mocked(useExpressionPracticeQuery);
const preloadMock = vi.mocked(preload);

const learning: ExpressionLearning = {
  expressionId: 7,
  targetExpressionText: 'get it',
  baseExpressionMeaningText: '이해하다',
  usageDescription: '설명',
  representativeQuestionText: null,
  representativeQuestionTranslation: null,
  representativeSentenceText: 'I get it',
  representativeSentenceTranslation: '이해했어',
  representativeSentenceWords: ['I', 'get', 'it'],
  representativeSentenceWordChoices: ['I', 'get', 'it'],
  representativeImageUrl: null,
  completed: false,
  representativeSentenceAudioUrl: null,
  targetExpressionAudioUrl: null,
};

const practice = (imageUrls: (string | null)[]): ExpressionPractice => ({
  targetExpressionText: 'get it',
  baseExpressionMeaningText: '이해하다',
  usageDescription: '설명',
  practiceSentence: imageUrls.map((imageUrl) => ({
    sentenceText: '',
    highlightingPart: '',
    sentenceTranslation: '',
    practiceQuestion: '',
    practiceQuestionTranslation: '',
    imageUrl,
  })),
  writingSentence: {
    writingSentenceText: '',
    writingSentenceTranslation: '',
    writingQuestion: '',
    writingQuestionTranslation: '',
    writingSentenceWords: [],
    writingSentenceWordChoices: [],
  },
});

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe('ExpressionFlow 예문 프리페치·preload', () => {
  it('QUIZ 스텝에서도 learning이 오면 practice를 미리 받도록 enabled를 켠다', () => {
    learningMock.mockReturnValue({
      learning,
      error: null,
      isLoading: false,
    });
    practiceMock.mockReturnValue({
      practice: null,
      error: null,
      isLoading: false,
    });

    render(
      <ExpressionFlow
        origin={{ kind: 'scenario', scenarioId: 1 }}
        expressionId={7}
      />,
    );

    // 첫 화면은 QUIZ지만 practice는 enabled=true로 호출돼 체류 중 데워진다
    expect(practiceMock).toHaveBeenCalledWith(7, true);
  });

  it('learning이 아직 없으면 practice를 미리 받지 않는다', () => {
    learningMock.mockReturnValue({
      learning: null,
      error: null,
      isLoading: true,
    });
    practiceMock.mockReturnValue({
      practice: null,
      error: null,
      isLoading: false,
    });

    render(
      <ExpressionFlow
        origin={{ kind: 'scenario', scenarioId: 1 }}
        expressionId={7}
      />,
    );

    expect(practiceMock).toHaveBeenCalledWith(7, false);
  });

  it('발음 자산이 있으면 설명(단독)→발음→추가 예문 순으로 스텝이 낀다', async () => {
    const user = userEvent.setup();
    learningMock.mockReturnValue({
      learning: {
        ...learning,
        representativeSentenceAudioUrl: 'https://cdn/audio.mp3',
      },
      error: null,
      isLoading: false,
    });
    practiceMock.mockReturnValue({
      practice: practice(['a.webp']),
      error: null,
      isLoading: false,
    });
    render(
      <ExpressionFlow
        origin={{ kind: 'scenario', scenarioId: 1 }}
        expressionId={7}
      />,
    );

    // QUIZ → EXPLAIN: 설명 단독 화면(B안)이 뜬다
    await user.click(screen.getByText('quiz-next'));
    expect(screen.getByText('intro:소리 내서 말해볼게요')).toBeInTheDocument();

    // EXPLAIN → PRONOUNCE → EXAMPLES: 추가 예문이 이제야 나온다
    await user.click(screen.getByText('intro-next'));
    expect(screen.getByText(/pronounce#/)).toBeInTheDocument();
    await user.click(screen.getByText('pronounce-next'));
    expect(screen.getByText('explain:복습 퀴즈 풀게요:1')).toBeInTheDocument();
  });

  it('녹음 전에 설명으로 되돌아가면 첫 방문 그대로 — 말하기 CTA와 건너뛰기가 남는다', async () => {
    const user = userEvent.setup();
    learningMock.mockReturnValue({
      learning: {
        ...learning,
        representativeSentenceAudioUrl: 'https://cdn/audio.mp3',
      },
      error: null,
      isLoading: false,
    });
    practiceMock.mockReturnValue({
      practice: practice([]),
      error: null,
      isLoading: false,
    });
    render(
      <ExpressionFlow
        origin={{ kind: 'scenario', scenarioId: 1 }}
        expressionId={7}
      />,
    );

    await user.click(screen.getByText('quiz-next'));
    await user.click(screen.getByText('intro-next'));
    await user.click(screen.getByText('pronounce-back'));

    expect(screen.getByText('intro:소리 내서 말해볼게요')).toBeInTheDocument();
    expect(screen.getByText('intro-skip')).toBeInTheDocument();
    // 보존할 상태가 없으니 발음 스텝은 숨겨두지 않는다
    expect(screen.queryByText(/pronounce#/)).not.toBeInTheDocument();
  });

  it('피드백을 받은 뒤 설명으로 되돌아가면 CTA가 "다음"만 남고, 발음 스텝은 상태 유지된 채 숨는다', async () => {
    const user = userEvent.setup();
    learningMock.mockReturnValue({
      learning: {
        ...learning,
        representativeSentenceAudioUrl: 'https://cdn/audio.mp3',
      },
      error: null,
      isLoading: false,
    });
    practiceMock.mockReturnValue({
      practice: practice([]),
      error: null,
      isLoading: false,
    });
    render(
      <ExpressionFlow
        origin={{ kind: 'scenario', scenarioId: 1 }}
        expressionId={7}
      />,
    );

    await user.click(screen.getByText('quiz-next'));
    await user.click(screen.getByText('intro-next'));
    // 분석 결과 도착(피드백·실패 화면 도달)
    await user.click(screen.getByText('pronounce-settled'));
    const firstMount = screen.getByText(/pronounce#/).textContent;

    // 발음 ‹ → 설명 재방문: 이미 피드백까지 갔으니 "다음"뿐, 건너뛰기는 없다
    await user.click(screen.getByText('pronounce-back'));
    expect(screen.getByText('intro:다음')).toBeInTheDocument();
    expect(screen.queryByText('intro-skip')).not.toBeInTheDocument();

    // 발음 스텝은 언마운트되지 않고 숨어 있다 — 돌아가면 보던 피드백·녹음 그대로
    expect(screen.getByText(/pronounce#/).textContent).toBe(firstMount);
    await user.click(screen.getByText('intro-next'));
    expect(screen.getByText(/pronounce#/).textContent).toBe(firstMount);
  });

  it('피드백을 받은 뒤 추가 예문으로 나갔다 뒤로 와도 발음 스텝이 유지된다', async () => {
    const user = userEvent.setup();
    learningMock.mockReturnValue({
      learning: {
        ...learning,
        representativeSentenceAudioUrl: 'https://cdn/audio.mp3',
      },
      error: null,
      isLoading: false,
    });
    practiceMock.mockReturnValue({
      practice: practice([]),
      error: null,
      isLoading: false,
    });
    render(
      <ExpressionFlow
        origin={{ kind: 'scenario', scenarioId: 1 }}
        expressionId={7}
      />,
    );

    await user.click(screen.getByText('quiz-next'));
    await user.click(screen.getByText('intro-next'));
    await user.click(screen.getByText('pronounce-settled'));
    const firstMount = screen.getByText(/pronounce#/).textContent;

    // 추가 예문으로 나가도 발음 스텝은 숨어서 살아 있고, ‹로 돌아오면 그 피드백 그대로
    await user.click(screen.getByText('pronounce-next'));
    expect(screen.getByText('explain:복습 퀴즈 풀게요:0')).toBeInTheDocument();
    expect(screen.getByText(/pronounce#/).textContent).toBe(firstMount);
    await user.click(screen.getByText('explain-back'));
    expect(screen.getByText(/pronounce#/).textContent).toBe(firstMount);
  });

  it('발음 스텝은 건너뛰기로 추가 예문까지 바로 갈 수 있다', async () => {
    const user = userEvent.setup();
    learningMock.mockReturnValue({
      learning: {
        ...learning,
        representativeSentenceAudioUrl: 'https://cdn/audio.mp3',
      },
      error: null,
      isLoading: false,
    });
    practiceMock.mockReturnValue({
      practice: practice([]),
      error: null,
      isLoading: false,
    });
    render(
      <ExpressionFlow
        origin={{ kind: 'scenario', scenarioId: 1 }}
        expressionId={7}
      />,
    );

    await user.click(screen.getByText('quiz-next'));
    await user.click(screen.getByText('intro-skip'));

    expect(screen.queryByText(/pronounce#/)).not.toBeInTheDocument();
    expect(screen.getByText('explain:복습 퀴즈 풀게요:0')).toBeInTheDocument();
  });

  it('건너뛴 뒤 추가 예문에서 뒤로 가면 설명(다음 CTA)으로 돌아가고, 다음은 추가 예문으로 복귀한다', async () => {
    const user = userEvent.setup();
    learningMock.mockReturnValue({
      learning: {
        ...learning,
        representativeSentenceAudioUrl: 'https://cdn/audio.mp3',
      },
      error: null,
      isLoading: false,
    });
    practiceMock.mockReturnValue({
      practice: practice([]),
      error: null,
      isLoading: false,
    });
    render(
      <ExpressionFlow
        origin={{ kind: 'scenario', scenarioId: 1 }}
        expressionId={7}
      />,
    );

    await user.click(screen.getByText('quiz-next'));
    await user.click(screen.getByText('intro-skip'));
    await user.click(screen.getByText('explain-back'));

    // 말하기를 건너뛴 사람에게 마이크를 다시 들이밀지 않는다 — 설명 재방문 + "다음"만
    expect(screen.queryByText(/pronounce#/)).not.toBeInTheDocument();
    expect(screen.getByText('intro:다음')).toBeInTheDocument();
    expect(screen.queryByText('intro-skip')).not.toBeInTheDocument();

    await user.click(screen.getByText('intro-next'));
    expect(screen.getByText('explain:복습 퀴즈 풀게요:0')).toBeInTheDocument();
  });

  it('복습 영작까지 갔다 뒤로 와도 발음 스텝이 유지된다', async () => {
    const user = userEvent.setup();
    learningMock.mockReturnValue({
      learning: {
        ...learning,
        representativeSentenceAudioUrl: 'https://cdn/audio.mp3',
      },
      error: null,
      isLoading: false,
    });
    practiceMock.mockReturnValue({
      practice: practice([]),
      error: null,
      isLoading: false,
    });
    render(
      <ExpressionFlow
        origin={{ kind: 'scenario', scenarioId: 1 }}
        expressionId={7}
      />,
    );

    await user.click(screen.getByText('quiz-next'));
    await user.click(screen.getByText('intro-next'));
    await user.click(screen.getByText('pronounce-settled'));
    const firstMount = screen.getByText(/pronounce#/).textContent;

    // 추가 예문 → 복습 영작까지 전진해도 발음 스텝은 숨어서 살아 있다
    await user.click(screen.getByText('pronounce-next'));
    await user.click(screen.getByText('explain-next'));
    expect(screen.getByText('quiz:review')).toBeInTheDocument();
    expect(screen.getByText(/pronounce#/).textContent).toBe(firstMount);

    // 복습 ‹ → 추가 예문 ‹ → 보던 발음 결과 그대로
    await user.click(screen.getByText('quiz-back'));
    await user.click(screen.getByText('explain-back'));
    expect(screen.getByText(/pronounce#/).textContent).toBe(firstMount);
  });

  it('발음 자산 소실(404) 뒤에는 뒤로가기가 죽은 발음 화면으로 되돌아가지 않는다', async () => {
    const user = userEvent.setup();
    learningMock.mockReturnValue({
      learning: {
        ...learning,
        representativeSentenceAudioUrl: 'https://cdn/audio.mp3',
      },
      error: null,
      isLoading: false,
    });
    practiceMock.mockReturnValue({
      practice: practice([]),
      error: null,
      isLoading: false,
    });
    render(
      <ExpressionFlow
        origin={{ kind: 'scenario', scenarioId: 1 }}
        expressionId={7}
      />,
    );

    await user.click(screen.getByText('quiz-next'));
    await user.click(screen.getByText('intro-next'));
    await user.click(screen.getByText('pronounce-unavailable'));

    // 추가 예문에서 뒤로 가면 발음(마이크)이 아니라 설명으로, 설명 다음도 추가 예문으로 복귀
    await user.click(screen.getByText('explain-back'));
    expect(screen.queryByText(/pronounce#/)).not.toBeInTheDocument();
    expect(screen.getByText('intro:다음')).toBeInTheDocument();
    await user.click(screen.getByText('intro-next'));
    expect(screen.getByText('explain:복습 퀴즈 풀게요:0')).toBeInTheDocument();
  });

  it('완료한 표현 재진입(learning.completed)이면 퀴즈 없이 설명부터 시작한다', () => {
    learningMock.mockReturnValue({
      learning: {
        ...learning,
        completed: true,
        representativeSentenceAudioUrl: 'https://cdn/audio.mp3',
      },
      error: null,
      isLoading: false,
    });
    practiceMock.mockReturnValue({
      practice: practice([]),
      error: null,
      isLoading: false,
    });
    render(
      <ExpressionFlow
        origin={{ kind: 'scenario', scenarioId: 1 }}
        expressionId={7}
      />,
    );

    expect(screen.queryByText('quiz:quiz')).not.toBeInTheDocument();
    expect(screen.getByText('intro:소리 내서 말해볼게요')).toBeInTheDocument();
  });

  it('발음 자산이 없으면 기존 3스텝 그대로 — 발음 스텝이 뜨지 않는다', async () => {
    const user = userEvent.setup();
    learningMock.mockReturnValue({ learning, error: null, isLoading: false });
    practiceMock.mockReturnValue({
      practice: practice([]),
      error: null,
      isLoading: false,
    });
    render(
      <ExpressionFlow
        origin={{ kind: 'scenario', scenarioId: 1 }}
        expressionId={7}
      />,
    );

    // EXPLAIN이 예문까지 품는 기존 화면 그대로 — B안 설명 단독 화면이 아니다
    await user.click(screen.getByText('quiz-next'));
    expect(screen.getByText('explain:복습 퀴즈 풀게요:0')).toBeInTheDocument();
    expect(screen.queryByText(/^intro:/)).not.toBeInTheDocument();

    // EXPLAIN → 곧장 REVIEW
    await user.click(screen.getByText('explain-next'));
    expect(screen.getByText('quiz:review')).toBeInTheDocument();
  });

  it('복습 영작으로 넘어가면 퀴즈에서 뽑은 상대를 그대로 쓴다', async () => {
    // given — 퀴즈가 클로이로 뜬 상태. 난수는 이후 호출마다 다른 값을 주어, 스텝마다 새로 뽑으면 상대가 바뀌게 한다
    const user = userEvent.setup();
    vi.spyOn(Math, 'random').mockReturnValueOnce(0).mockReturnValue(0.9);
    learningMock.mockReturnValue({ learning, error: null, isLoading: false });
    practiceMock.mockReturnValue({
      practice: practice([]),
      error: null,
      isLoading: false,
    });
    render(
      <ExpressionFlow
        origin={{ kind: 'scenario', scenarioId: 1 }}
        expressionId={7}
      />,
    );
    expect(screen.getByText('partner:chloe')).toBeInTheDocument();

    // when — 설명을 지나 복습 영작까지 간다
    await user.click(screen.getByText('quiz-next'));
    await user.click(screen.getByText('explain-next'));

    // then — 복습도 클로이다
    expect(screen.getByText('quiz:review')).toBeInTheDocument();
    expect(screen.getByText('partner:chloe')).toBeInTheDocument();
  });

  it('예문 이미지가 있으면 URL을 image로 preload한다', () => {
    learningMock.mockReturnValue({
      learning,
      error: null,
      isLoading: false,
    });
    practiceMock.mockReturnValue({
      practice: practice(['a.webp', null, 'b.webp']),
      error: null,
      isLoading: false,
    });

    render(
      <ExpressionFlow
        origin={{ kind: 'scenario', scenarioId: 1 }}
        expressionId={7}
      />,
    );

    expect(preloadMock).toHaveBeenCalledWith('a.webp', { as: 'image' });
    expect(preloadMock).toHaveBeenCalledWith('b.webp', { as: 'image' });
    expect(preloadMock).toHaveBeenCalledTimes(2);
  });
});
