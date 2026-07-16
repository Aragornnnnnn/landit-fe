'use client';

// 표현학습 플로우 — 단어 선택 퀴즈(D안 ①') → 표현 설명(D안 ④) → 복습 영작(D안 ⑤) → 완료 처리 후 리스트로.
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { preload } from 'react-dom';

import { collectPreloadImageUrls } from '../model/preloadImages';
import { fromLearning } from '../model/sentenceQuiz';
import { useExpressionLearning } from '../model/useExpressionLearning';
import { useExpressionPractice } from '../model/useExpressionPractice';
import { useFinishExpression } from '../model/useFinishExpression';
import { ExplanationStep } from './ExplanationStep';
import { ExpressionExitSheet } from './ExpressionExitSheet';
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
  // 예문까지(QUIZ·EXPLAIN)는 뒤로가기 대신 X로 나가며, 중단 확인 시트를 먼저 띄운다
  const [exitOpen, setExitOpen] = useState(false);

  // 플로우 전체(퀴즈·설명·복습)는 대표 예문(learning-start)만으로 굴러간다.
  // 추가 예문(practice)은 설명 스텝의 "이렇게도 써요"에만 쓰는 보강 데이터라, 없거나 실패해도 플로우를 막지 않는다.
  const {
    learning,
    error: learningError,
    isLoading: learningLoading,
  } = useExpressionLearning(expressionId);
  // learning이 오면(=QUIZ 진입) 예문을 미리 받아, QUIZ 체류 중 EXPLAIN용 practice를 데워둔다.
  const { practice } = useExpressionPractice(expressionId, !!learning);
  const finish = useFinishExpression(expressionId);

  // 예문 이미지는 QUIZ→EXPLAIN에서 마운트되지만, URL을 아는 즉시 브라우저 캐시에 선로드해
  // EXPLAIN 도착 시 img가 곧바로 뜨게 한다. preload는 멱등이라 렌더 중 호출해도 안전하다.
  for (const url of collectPreloadImageUrls(practice)) {
    preload(url, { as: 'image' });
  }

  // 학습을 나가면 홈으로 돌아가 해당 카드를 뒤집어(뒷면=표현 리스트) 보여준다.
  // replace로 표현학습을 히스토리에서 지워, 홈에서 뒤로가기 시 퀴즈로 재진입하지 않게 한다.
  const backToList = () => router.replace(`/home?flip=${scenarioId}`);
  // 완료 후엔 방금 해금된 다음 표현으로 스크롤·강조되도록 just 신호를 붙인다
  const backToListUnlocked = () =>
    router.replace(`/home?flip=${scenarioId}&just=1`);

  if (learningLoading) return <FlowStatus>불러오는 중…</FlowStatus>;
  if (learningError || !learning) {
    return (
      <FlowStatus>
        {learningError?.message ?? '표현을 불러오지 못했어요.'}
      </FlowStatus>
    );
  }

  const quiz = fromLearning(learning);

  // 중단 확인 시트 — QUIZ·EXPLAIN에서 X를 누르면 뜬다. 확인 시 완료 처리 없이 리스트로.
  const exitSheet = (
    <ExpressionExitSheet
      open={exitOpen}
      onConfirm={backToList}
      onClose={() => setExitOpen(false)}
    />
  );

  if (step === 'QUIZ') {
    return (
      <>
        <QuizStep
          quiz={quiz}
          leftAction="close"
          onBack={() => setExitOpen(true)}
          onNext={() => setStep('EXPLAIN')}
        />
        {exitSheet}
      </>
    );
  }

  if (step === 'EXPLAIN') {
    return (
      <>
        <ExplanationStep
          targetExpressionText={learning.targetExpressionText}
          baseExpressionMeaningText={learning.baseExpressionMeaningText}
          usageDescription={learning.usageDescription}
          examples={practice?.practiceSentence ?? []}
          title={learning.baseExpressionMeaningText}
          progress={0.7}
          nextLabel="복습 영작 할게요"
          leftAction="close"
          onBack={() => setExitOpen(true)}
          onNext={() => setStep('REVIEW')}
        />
        {exitSheet}
      </>
    );
  }

  // 복습 영작 — 퀴즈와 같은 대표 예문을 이번엔 '입력'으로 (퀴즈=선택과 구분). 정답 시 학습 완료.
  return (
    <ReviewInputStep
      quiz={quiz}
      targetExpressionText={learning.targetExpressionText}
      meaning={learning.baseExpressionMeaningText}
      onBack={() => setStep('EXPLAIN')}
      finishing={finish.isPending}
      onFinish={() =>
        finish.mutate(undefined, { onSuccess: backToListUnlocked })
      }
    />
  );
};

const FlowStatus = ({ children }: { children: React.ReactNode }) => (
  <div className="mx-auto flex h-dvh max-w-[430px] items-center justify-center bg-background px-6 text-center text-sm font-medium text-muted-foreground">
    {children}
  </div>
);
