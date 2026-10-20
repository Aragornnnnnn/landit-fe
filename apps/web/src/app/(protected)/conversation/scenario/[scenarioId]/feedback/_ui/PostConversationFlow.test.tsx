// 대화 직후 화면 순서 — 분석에서 결과가 오면 레벨을 거치고, 못 받으면 건너뛰며, 학습 준비의 CTA가 끝이다
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { SCENARIO_WALL_IMAGES } from '@/app/(protected)/paywall/_model/paywall-content';

import { PostConversationFlow } from './PostConversationFlow';

// 그림 미리 받기는 자기 테스트가 있다 — 여기선 무엇을 미리 받는지와 화면 계약만 본다
const mocks = vi.hoisted(() => ({ preloadImages: vi.fn() }));
vi.mock('@/shared/lib/preload-next-images', () => ({
  preloadImages: mocks.preloadImages,
}));
vi.mock('@/shared/motion', () => ({
  Transition: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));
vi.mock('@/features/expression/model/useExpressionsQuery', () => ({
  useExpressionsQuery: () => ({ expressions: null }),
}));
vi.mock('./AnalyzingScreen', () => ({
  AnalyzingScreen: ({
    onDone,
  }: {
    onDone: (assessment: { assessedLevel: number } | null) => void;
  }) => (
    <>
      <button onClick={() => onDone({ assessedLevel: 3 })}>결과 있음</button>
      <button onClick={() => onDone(null)}>결과 없음</button>
    </>
  ),
}));
vi.mock('./LevelResultScreen', () => ({
  LevelResultScreen: ({
    assessment,
    onContinue,
  }: {
    assessment: { assessedLevel: number };
    onContinue: () => void;
  }) => <button onClick={onContinue}>레벨 {assessment.assessedLevel}</button>,
}));
vi.mock('./PreparedLearningScreen', () => ({
  SLIDE_IMAGES: [],
  PreparedLearningScreen: ({ onContinue }: { onContinue: () => void }) => (
    <button onClick={onContinue}>학습 시작하기</button>
  ),
}));

afterEach(() => cleanup());

describe('PostConversationFlow', () => {
  it('분석에서 결과가 오면 레벨 결과를 거쳐 학습 준비로 가고, CTA가 끝이다', () => {
    const onFinish = vi.fn();
    render(
      <PostConversationFlow sessionId={1} scenarioId={7} onFinish={onFinish} />,
    );

    fireEvent.click(screen.getByText('결과 있음'));
    fireEvent.click(screen.getByText('레벨 3'));
    fireEvent.click(screen.getByText('학습 시작하기'));

    expect(onFinish).toHaveBeenCalledTimes(1);
  });

  it('분석 결과를 못 받으면 레벨 화면 없이 학습 준비로 간다', () => {
    render(
      <PostConversationFlow sessionId={1} scenarioId={7} onFinish={vi.fn()} />,
    );

    fireEvent.click(screen.getByText('결과 없음'));

    expect(screen.getByText('학습 시작하기')).toBeInTheDocument();
    expect(screen.queryByText(/레벨/)).not.toBeInTheDocument();
  });

  it('분석하는 동안 환급 페이월 맨 위 카드 벽 그림을 미리 받는다 — 대화 뒤 페이월이 뜰 때 카드가 늦게 차지 않게', () => {
    render(
      <PostConversationFlow sessionId={1} scenarioId={7} onFinish={vi.fn()} />,
    );

    expect(mocks.preloadImages).toHaveBeenCalledWith(
      expect.arrayContaining(SCENARIO_WALL_IMAGES),
    );
  });
});
