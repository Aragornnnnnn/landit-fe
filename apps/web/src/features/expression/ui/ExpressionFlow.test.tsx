// 예문 워터폴 제거 배선 검증 — QUIZ 체류 중 practice 프리페치 + 예문 이미지 preload
import { cleanup, render } from '@testing-library/react';
import { preload } from 'react-dom';
import { afterEach, describe, expect, it, vi } from 'vitest';

import type { ExpressionLearning } from '../api/learning';
import type { ExpressionPractice } from '../api/practice';
import { useExpressionLearning } from '../model/useExpressionLearning';
import { useExpressionPractice } from '../model/useExpressionPractice';
import { ExpressionFlow } from './ExpressionFlow';

// preload만 스파이로 바꾸고 나머지 react-dom(렌더러가 씀)은 원본 유지
vi.mock('react-dom', async (importOriginal) => ({
  ...(await importOriginal<typeof import('react-dom')>()),
  preload: vi.fn(),
}));
vi.mock('next/navigation', () => ({ useRouter: () => ({ push: vi.fn() }) }));
vi.mock('../model/useExpressionLearning', () => ({
  useExpressionLearning: vi.fn(),
}));
vi.mock('../model/useExpressionPractice', () => ({
  useExpressionPractice: vi.fn(),
}));
vi.mock('../model/useFinishExpression', () => ({
  useFinishExpression: () => ({ mutate: vi.fn(), isPending: false }),
}));
// 스텝 UI는 이 테스트 관심사가 아니라 스텁으로 대체(무거운 하위 의존 회피)
vi.mock('./QuizStep', () => ({ QuizStep: () => <div>quiz</div> }));
vi.mock('./ExpressionExitSheet', () => ({ ExpressionExitSheet: () => null }));

const learningMock = vi.mocked(useExpressionLearning);
const practiceMock = vi.mocked(useExpressionPractice);
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

    render(<ExpressionFlow scenarioId={1} expressionId={7} />);

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

    render(<ExpressionFlow scenarioId={1} expressionId={7} />);

    expect(practiceMock).toHaveBeenCalledWith(7, false);
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

    render(<ExpressionFlow scenarioId={1} expressionId={7} />);

    expect(preloadMock).toHaveBeenCalledWith('a.webp', { as: 'image' });
    expect(preloadMock).toHaveBeenCalledWith('b.webp', { as: 'image' });
    expect(preloadMock).toHaveBeenCalledTimes(2);
  });
});
