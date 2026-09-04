// 예문 프리페치 배선 검증 + 발음 스텝 게이트 검증
import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { track } from '@/shared/analytics';

import type { ExpressionLearning } from '../api/learning';
import type { ExpressionPractice } from '../api/practice';
import { useExpressionLearningQuery } from '../model/useExpressionLearningQuery';
import { useExpressionPracticeQuery } from '../model/useExpressionPracticeQuery';
import { ExpressionFlow } from './ExpressionFlow';

vi.mock('next/navigation', () => ({ useRouter: () => ({ push: vi.fn() }) }));
vi.mock('@/shared/analytics', () => ({ track: vi.fn() }));
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
// 복습 큐 검증용으로 지금 문제(answerText)·CTA 문구·마지막 여부(correctSlot)를 노출하고,
// 마운트 식별자로 예문을 다녀와도 리마운트(상태 소실)되지 않는지 본다
vi.mock('./learning/QuizStep', async () => {
  const { useState } = await import('react');
  let mountSeq = 0;
  return {
    QuizStep: ({
      step,
      quiz,
      partner,
      onNext,
      onBack,
      nextLabel,
      wrongLabel,
      correctSlot,
      instruction,
      revealAnswer,
    }: {
      step: string;
      quiz: { answerText: string };
      partner: string;
      onNext: (result: 'correct' | 'wrong') => void;
      onBack: () => void;
      nextLabel?: string;
      wrongLabel?: string;
      correctSlot?: () => React.ReactNode;
      instruction?: string;
      revealAnswer?: boolean;
    }) => {
      const [mountId] = useState(() => ++mountSeq);
      return (
        <div>
          <p>quiz:{step}</p>
          <p>quiz#{mountId}</p>
          <p>partner:{partner}</p>
          <p>question:{quiz.answerText}</p>
          <p>
            labels:{nextLabel}/{wrongLabel ?? nextLabel}
          </p>
          <p>last:{correctSlot ? 'y' : 'n'}</p>
          <p>instruction:{instruction ?? '-'}</p>
          <p>reveal:{revealAnswer ? 'y' : 'n'}</p>
          <button onClick={() => onNext('correct')}>quiz-next</button>
          <button onClick={() => onNext('wrong')}>quiz-wrong</button>
          <button onClick={onBack}>quiz-back</button>
        </div>
      );
    },
  };
});
// 예문 스텝 — 예문 개수를 노출한다
vi.mock('./learning/ExamplesStep', () => ({
  ExamplesStep: ({
    examples,
    leftAction = 'back',
    onNext,
    onBack,
  }: {
    examples: unknown[];
    leftAction?: string;
    onNext: () => void;
    onBack: () => void;
  }) => (
    <div>
      <p>
        examples:{examples.length}:{leftAction}
      </p>
      <button onClick={onNext}>examples-next</button>
      <button onClick={onBack}>examples-back</button>
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
  ExpressionExitSheet: ({ open }: { open: boolean }) =>
    open ? <p>exit-sheet</p> : null,
}));

const learningMock = vi.mocked(useExpressionLearningQuery);
const practiceMock = vi.mocked(useExpressionPracticeQuery);

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

// 예문 개수만 바꿔 쓰는 practice 응답 — 내용은 스텝 스텁이 보지 않는다.
// 작문 문제는 기본 비워 대표 예문 폴백(1문제)으로 두고, 큐 검증에서만 EN·KR 두 문제를 넣는다
const practice = (
  exampleCount: number,
  writingSentence: ExpressionPractice['writingSentence'] = [],
): ExpressionPractice => ({
  targetExpressionText: 'get it',
  baseExpressionMeaningText: '이해하다',
  usageDescription: '설명',
  practiceSentence: Array.from({ length: exampleCount }, () => ({
    sentenceText: '',
    highlightingPart: '',
    sentenceTranslation: '',
    practiceQuestion: '',
    practiceQuestionTranslation: '',
    imageUrl: null,
  })),
  writingSentence,
});

// 영어 문제 → 한국어 문제 순으로 온 작문 문제 2건
const twoWritingSentences: ExpressionPractice['writingSentence'] = [
  {
    quizLanguage: 'EN',
    writingSentenceText: 'I get it now',
    writingSentenceTranslation: '이제 알겠어',
    writingQuestion: '',
    writingQuestionTranslation: '',
    writingSentenceWords: ['I', 'get', 'it', 'now'],
    writingSentenceWordChoices: ['now', 'I', 'it', 'get'],
  },
  {
    quizLanguage: 'KR',
    writingSentenceText: 'Do you get it?',
    writingSentenceTranslation: '이해돼?',
    writingQuestion: '',
    writingQuestionTranslation: '',
    writingSentenceWords: ['이해돼?'],
    writingSentenceWordChoices: ['이해돼?', '몰라'],
  },
];

// 발음 없는 표현으로 복습까지 간다 — 큐 검증의 공통 출발점
const renderAtReview = async (
  user: ReturnType<typeof userEvent.setup>,
  writingSentence: ExpressionPractice['writingSentence'],
) => {
  learningMock.mockReturnValue({ learning, error: null, isLoading: false });
  practiceMock.mockReturnValue({
    practice: practice(0, writingSentence),
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
};

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe('ExpressionFlow 예문 프리페치', () => {
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

  it('발음 자산이 있으면 설명→발음→예문→복습 순으로 스텝이 낀다', async () => {
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
      practice: practice(2),
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

    // EXPLAIN → PRONOUNCE → 예문 → REVIEW
    await user.click(screen.getByText('intro-next'));
    expect(screen.getByText(/pronounce#/)).toBeInTheDocument();
    await user.click(screen.getByText('pronounce-next'));
    expect(screen.getByText('examples:2:back')).toBeInTheDocument();
    await user.click(screen.getByText('examples-next'));
    expect(screen.getByText('quiz:review')).toBeInTheDocument();
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
      practice: practice(0),
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
      practice: practice(0),
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

  it('예문이 없으면 발음 뒤 예문 화면 없이 곧장 복습이고, 뒤로 와도 발음 스텝이 유지된다', async () => {
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
      practice: practice(0),
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

    // 복습으로 나가도 발음 스텝은 숨어서 살아 있고, ‹로 돌아오면 그 피드백 그대로
    await user.click(screen.getByText('pronounce-next'));
    expect(screen.getByText('quiz:review')).toBeInTheDocument();
    expect(screen.getByText(/pronounce#/).textContent).toBe(firstMount);
    await user.click(screen.getByText('quiz-back'));
    expect(screen.getByText(/pronounce#/).textContent).toBe(firstMount);
  });

  it('발음 스텝은 건너뛰기로 예문까지 바로 갈 수 있다', async () => {
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
      practice: practice(2),
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
    expect(screen.getByText('examples:2:back')).toBeInTheDocument();
  });

  it('건너뛴 뒤 예문에서 뒤로 가면 설명(다음 CTA)으로 돌아가고, 다음은 예문으로 복귀한다', async () => {
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
      practice: practice(2),
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
    await user.click(screen.getByText('examples-back'));

    // 말하기를 건너뛴 사람에게 마이크를 다시 들이밀지 않는다 — 설명 재방문 + "다음"만
    expect(screen.queryByText(/pronounce#/)).not.toBeInTheDocument();
    expect(screen.getByText('intro:다음')).toBeInTheDocument();
    expect(screen.queryByText('intro-skip')).not.toBeInTheDocument();

    await user.click(screen.getByText('intro-next'));
    expect(screen.getByText('examples:2:back')).toBeInTheDocument();
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
      practice: practice(0),
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

    // 복습 영작까지 전진해도 발음 스텝은 숨어서 살아 있다
    await user.click(screen.getByText('pronounce-next'));
    expect(screen.getByText('quiz:review')).toBeInTheDocument();
    expect(screen.getByText(/pronounce#/).textContent).toBe(firstMount);

    // 복습 ‹ → 보던 발음 결과 그대로
    await user.click(screen.getByText('quiz-back'));
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
      practice: practice(0),
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

    // 복습에서 뒤로 가면 발음(마이크)이 아니라 설명으로, 설명 다음도 복습으로 복귀
    await user.click(screen.getByText('quiz-back'));
    expect(screen.queryByText(/pronounce#/)).not.toBeInTheDocument();
    expect(screen.getByText('intro:다음')).toBeInTheDocument();
    await user.click(screen.getByText('intro-next'));
    expect(screen.getByText('quiz:review')).toBeInTheDocument();
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
      practice: practice(0),
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

  it('발음 자산이 없고 예문도 없으면 퀴즈 다음이 곧장 복습이고, 뒤로가기는 나가기 확인이다', async () => {
    const user = userEvent.setup();
    learningMock.mockReturnValue({ learning, error: null, isLoading: false });
    practiceMock.mockReturnValue({
      practice: practice(0),
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
    expect(screen.queryByText(/^intro:/)).not.toBeInTheDocument();
    expect(screen.getByText('quiz:review')).toBeInTheDocument();

    // 되돌아갈 설명 화면이 없으니 ‹ 대신 X — 나가기 확인 시트
    await user.click(screen.getByText('quiz-back'));
    expect(screen.getByText('exit-sheet')).toBeInTheDocument();
  });

  it('복습 두 문제는 서로 다른 상대가 묻고, 같은 문제가 다시 나오면 같은 상대다', async () => {
    const user = userEvent.setup();
    await renderAtReview(user, twoWritingSentences);
    const first = screen.getByText(/^partner:/).textContent;

    // 1번 틀림 → 2번 문제는 다른 상대
    await user.click(screen.getByText('quiz-wrong'));
    const second = screen.getByText(/^partner:/).textContent;
    expect(second).not.toBe(first);

    // 2번 맞힘 → 1번 재출제는 처음 그 상대
    await user.click(screen.getByText('quiz-next'));
    expect(screen.getByText('question:I get it now')).toBeInTheDocument();
    expect(screen.getByText(/^partner:/).textContent).toBe(first);
  });
});

describe('ExpressionFlow 복습 큐', () => {
  it('두 문제를 차례로 맞히면 첫 정답은 다음 문제로 넘기고 마지막 정답에서만 획득 연출을 띄운다', async () => {
    const user = userEvent.setup();
    await renderAtReview(user, twoWritingSentences);

    // 첫 문제(EN) — 아직 마지막이 아니라 획득 연출 없이 "다음 문제"
    expect(screen.getByText('question:I get it now')).toBeInTheDocument();
    expect(screen.getByText('last:n')).toBeInTheDocument();
    expect(screen.getByText('labels:다음 문제/다음 문제')).toBeInTheDocument();

    await user.click(screen.getByText('quiz-next'));

    // 둘째 문제(KR) — 마지막이라 정답에 획득 연출이 붙는다
    expect(screen.getByText('question:이해돼?')).toBeInTheDocument();
    expect(screen.getByText('last:y')).toBeInTheDocument();
  });

  it('틀린 문제는 다른 문제를 낸 뒤 다시 나오고, 그때 맞히면 마지막이다', async () => {
    const user = userEvent.setup();
    await renderAtReview(user, twoWritingSentences);

    await user.click(screen.getByText('quiz-wrong'));
    expect(screen.getByText('question:이해돼?')).toBeInTheDocument();
    expect(screen.getByText('last:n')).toBeInTheDocument();

    await user.click(screen.getByText('quiz-next'));
    expect(screen.getByText('question:I get it now')).toBeInTheDocument();
    expect(screen.getByText('last:y')).toBeInTheDocument();
  });

  it('남은 문제가 하나뿐일 때 틀리면 오답 CTA가 "다시 풀어볼게요"고, 같은 문제를 새로 낸다', async () => {
    const user = userEvent.setup();
    await renderAtReview(user, twoWritingSentences);
    await user.click(screen.getByText('quiz-next'));
    expect(
      screen.getByText('labels:다음 문제/다시 풀어볼게요'),
    ).toBeInTheDocument();
    const beforeWrong = screen.getByText(/quiz#/).textContent;

    await user.click(screen.getByText('quiz-wrong'));

    // 같은 문제가 새 QuizStep으로 다시 나온다 — 틀렸던 칩 배치가 남지 않는다
    expect(screen.getByText('question:이해돼?')).toBeInTheDocument();
    expect(screen.getByText('last:y')).toBeInTheDocument();
    expect(screen.getByText(/quiz#/).textContent).not.toBe(beforeWrong);
  });

  it('틀린 문제가 다시 나오면 라벨이 "다시 한번 해보세요"로 바뀌고, 두 번 틀리면 정답을 보여준다', async () => {
    const user = userEvent.setup();
    await renderAtReview(user, twoWritingSentences);
    expect(screen.getByText('instruction:-')).toBeInTheDocument();

    // 1번 문제 틀림 → 2번 문제(처음)는 기본 라벨
    await user.click(screen.getByText('quiz-wrong'));
    expect(screen.getByText('question:이해돼?')).toBeInTheDocument();
    expect(screen.getByText('instruction:-')).toBeInTheDocument();

    // 2번 문제 맞힘 → 1번 문제 재도전: 같은 문제에 라벨만 바뀐다
    await user.click(screen.getByText('quiz-next'));
    expect(screen.getByText('question:I get it now')).toBeInTheDocument();
    expect(
      screen.getByText('instruction:다시 한번 해보세요'),
    ).toBeInTheDocument();
    expect(screen.getByText('reveal:n')).toBeInTheDocument();

    // 두 번째 틀림 → 정답을 보여주며 다시 낸다
    await user.click(screen.getByText('quiz-wrong'));
    expect(screen.getByText('question:I get it now')).toBeInTheDocument();
    expect(
      screen.getByText('instruction:정답을 보고 그대로 만들어보세요'),
    ).toBeInTheDocument();
    expect(screen.getByText('reveal:y')).toBeInTheDocument();
  });

  it('예문을 다시 보러 나갔다 돌아와도 복습 QuizStep이 그대로라 고른 칩과 큐가 유지된다', async () => {
    const user = userEvent.setup();
    learningMock.mockReturnValue({ learning, error: null, isLoading: false });
    practiceMock.mockReturnValue({
      practice: practice(2, twoWritingSentences),
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
    await user.click(screen.getByText('examples-next'));
    const mount = screen.getByText(/quiz#/).textContent;

    await user.click(screen.getByText('quiz-back'));
    expect(screen.getByText('examples:2:close')).toBeInTheDocument();
    await user.click(screen.getByText('examples-next'));

    expect(screen.getByText(/quiz#/).textContent).toBe(mount);
  });

  it('작문 문제를 못 받았으면 대표 예문 1문제로 폴백해 바로 마지막이다', async () => {
    const user = userEvent.setup();
    await renderAtReview(user, []);

    expect(screen.getByText('question:I get it')).toBeInTheDocument();
    expect(screen.getByText('last:y')).toBeInTheDocument();
  });
});

describe('ExpressionFlow 예문 스텝', () => {
  it('발음이 없으면 퀴즈→예문→복습이고, 예문의 X는 나가기 확인, 복습의 뒤로는 예문이다', async () => {
    const user = userEvent.setup();
    learningMock.mockReturnValue({ learning, error: null, isLoading: false });
    practiceMock.mockReturnValue({
      practice: practice(2),
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
    expect(screen.getByText('examples:2:close')).toBeInTheDocument();
    await user.click(screen.getByText('examples-next'));
    expect(screen.getByText('quiz:review')).toBeInTheDocument();

    await user.click(screen.getByText('quiz-back'));
    expect(screen.getByText('examples:2:close')).toBeInTheDocument();
    await user.click(screen.getByText('examples-back'));
    expect(screen.getByText('exit-sheet')).toBeInTheDocument();
  });

  it('완료한 표현 재진입에 발음이 없으면 퀴즈 없이 예문부터 시작한다', () => {
    learningMock.mockReturnValue({
      learning: { ...learning, completed: true },
      error: null,
      isLoading: false,
    });
    practiceMock.mockReturnValue({
      practice: practice(2),
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
    expect(screen.getByText('examples:2:close')).toBeInTheDocument();
  });

  it('practice가 아직 안 왔으면 예문 자리에서 기다렸다가, 도착하면 예문을 보여준다', async () => {
    const user = userEvent.setup();
    learningMock.mockReturnValue({ learning, error: null, isLoading: false });
    practiceMock.mockReturnValue({
      practice: null,
      error: null,
      isLoading: true,
    });
    const view = render(
      <ExpressionFlow
        origin={{ kind: 'scenario', scenarioId: 1 }}
        expressionId={7}
      />,
    );
    await user.click(screen.getByText('quiz-next'));

    // 아직 예문도 복습도 아니다 — 로딩 자리만
    expect(screen.queryByText(/^examples:/)).not.toBeInTheDocument();
    expect(screen.queryByText('quiz:review')).not.toBeInTheDocument();

    practiceMock.mockReturnValue({
      practice: practice(2),
      error: null,
      isLoading: false,
    });
    view.rerender(
      <ExpressionFlow
        origin={{ kind: 'scenario', scenarioId: 1 }}
        expressionId={7}
      />,
    );

    expect(screen.getByText('examples:2:close')).toBeInTheDocument();
  });

  it('예문 차례인데 예문이 없으면 복습을 보여주고 계측 step도 review다', () => {
    learningMock.mockReturnValue({
      learning: { ...learning, completed: true },
      error: null,
      isLoading: false,
    });
    practiceMock.mockReturnValue({
      practice: practice(0),
      error: null,
      isLoading: false,
    });
    render(
      <ExpressionFlow
        origin={{ kind: 'scenario', scenarioId: 1 }}
        expressionId={7}
      />,
    );

    expect(screen.getByText('quiz:review')).toBeInTheDocument();
    expect(track).toHaveBeenCalledWith('Expression Step Viewed', {
      expression_id: 7,
      step: 'review',
    });
    expect(track).not.toHaveBeenCalledWith('Expression Step Viewed', {
      expression_id: 7,
      step: 'examples',
    });
  });
});
