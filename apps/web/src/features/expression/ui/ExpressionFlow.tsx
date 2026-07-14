'use client';

// 표현학습 플로우 — 단어 선택 퀴즈(D안 ①') → 표현 설명(D안 ④) → 복습 영작(D안 ⑤) → 완료 처리 후 리스트로.
import { useState } from 'react';
import { useRouter } from 'next/navigation';

import { useExpressionPractice } from '../model/useExpressionPractice';
import { useFinishExpression } from '../model/useFinishExpression';
import { ExplanationStep } from './ExplanationStep';
import { QuizStep } from './QuizStep';
import { ReviewInputStep } from './ReviewInputStep';

interface ExpressionFlowProps {
  scenarioId: number;
  expressionId: number;
}

export const ExpressionFlow = ({
  scenarioId,
  expressionId,
}: ExpressionFlowProps) => {
  const router = useRouter();
  const [step, setStep] = useState<'QUIZ' | 'EXPLAIN' | 'REVIEW'>('QUIZ');

  // 퀴즈 문제(정답 단어·섞인 뱅크)와 표현 설명은 모두 practice에 담겨오므로 바로 로드한다
  const { practice, error, isLoading } = useExpressionPractice(
    expressionId,
    true,
  );
  const finish = useFinishExpression(expressionId);

  const backToList = () => router.push(`/expressions/${scenarioId}`);

  if (isLoading) return <FlowStatus>불러오는 중…</FlowStatus>;
  if (error || !practice) {
    return (
      <FlowStatus>{error?.message ?? '표현을 불러오지 못했어요.'}</FlowStatus>
    );
  }

  const title = practice.baseExpressionMeaningText;

  if (step === 'QUIZ') {
    return (
      <QuizStep
        practice={practice}
        onBack={backToList}
        onNext={() => setStep('EXPLAIN')}
      />
    );
  }

  if (step === 'EXPLAIN') {
    return (
      <ExplanationStep
        practice={practice}
        title={title}
        progress={0.7}
        nextLabel="복습 영작 할게요"
        onBack={() => setStep('QUIZ')}
        onNext={() => setStep('REVIEW')}
      />
    );
  }

  // 복습 영작 — 같은 문장을 이번엔 '입력'으로 (퀴즈=선택과 구분). 정답 시 학습 완료.
  return (
    <ReviewInputStep
      practice={practice}
      onBack={() => setStep('EXPLAIN')}
      finishing={finish.isPending}
      onFinish={() => finish.mutate(undefined, { onSuccess: backToList })}
    />
  );
};

const FlowStatus = ({ children }: { children: React.ReactNode }) => (
  <div className="mx-auto flex h-dvh max-w-[430px] items-center justify-center bg-background px-6 text-center text-sm font-medium text-muted-foreground">
    {children}
  </div>
);
