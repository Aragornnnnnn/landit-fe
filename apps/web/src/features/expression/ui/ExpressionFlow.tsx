'use client';

// 표현학습 플로우 — 단어 선택 퀴즈(D안 ①') → 표현 설명(D안 ④) → 완료 처리 후 리스트로. (복습 영작은 후속 PR)
import { useState } from 'react';
import { useRouter } from 'next/navigation';

import { useExpressionPractice } from '../model/useExpressionPractice';
import { useFinishExpression } from '../model/useFinishExpression';
import { ExplanationStep } from './ExplanationStep';
import { QuizStep } from './QuizStep';

interface ExpressionFlowProps {
  scenarioId: number;
  expressionId: number;
}

export const ExpressionFlow = ({
  scenarioId,
  expressionId,
}: ExpressionFlowProps) => {
  const router = useRouter();
  const [step, setStep] = useState<'QUIZ' | 'EXPLAIN'>('QUIZ');

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

  // 표현 설명 — 이 PR에선 마지막 스텝이라 설명을 보면 학습 완료 처리한다
  return (
    <ExplanationStep
      practice={practice}
      title={title}
      progress={1}
      nextLabel="학습 완료"
      finishing={finish.isPending}
      onBack={() => setStep('QUIZ')}
      onNext={() => finish.mutate(undefined, { onSuccess: backToList })}
    />
  );
};

const FlowStatus = ({ children }: { children: React.ReactNode }) => (
  <div className="mx-auto flex h-dvh max-w-[430px] items-center justify-center bg-background px-6 text-center text-sm font-medium text-muted-foreground">
    {children}
  </div>
);
