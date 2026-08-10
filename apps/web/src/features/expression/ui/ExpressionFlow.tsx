'use client';

// 표현학습 플로우 — 단어 선택 퀴즈(D안 ①') → 표현 설명(D안 ④) → 복습 영작(D안 ⑤) → 완료 처리 후 리스트로.
import { useEffect, useState } from 'react';
import { EVENTS, type ExpressionStep } from '@landit/analytics';
import { useRouter } from 'next/navigation';
import { preload } from 'react-dom';

import { track } from '@/shared/analytics';
import { scenarioReturnPath } from '@/shared/lib/routes';

import { collectPreloadImageUrls } from '../lib/preload-images';
import { fromLearning, fromWritingSentence } from '../model/sentence-quiz';
import { useExpressionLearningQuery } from '../model/useExpressionLearningQuery';
import { useExpressionPracticeQuery } from '../model/useExpressionPracticeQuery';
import { useFinishExpressionMutation } from '../model/useFinishExpressionMutation';
import { ExpressionExitSheet } from './ExpressionExitSheet';
import { ExplanationStep } from './learning/ExplanationStep';
import { QuizStep } from './learning/QuizStep';
import { QuizStepSkeleton } from './learning/QuizStepSkeleton';
import { ReviewSuccess } from './practice/ReviewSuccess';

interface ExpressionFlowProps {
  scenarioId: number;
  expressionId: number;
  // 어느 날 카드에서 들어왔는지. 나갈 때 그 날 카드로 돌려보낸다
  date?: string;
}

// 화면 스텝(QUIZ/EXPLAIN/REVIEW) → 이벤트 속성 값
const STEP_PROP: Record<'QUIZ' | 'EXPLAIN' | 'REVIEW', ExpressionStep> = {
  QUIZ: 'quiz',
  EXPLAIN: 'explain',
  REVIEW: 'review',
};

// EXPLAIN이 멈추는 진행바 지점 — REVIEW가 이 지점부터 이어받아 1까지 채운다
const EXPLAIN_PROGRESS = 0.7;

export const ExpressionFlow = ({
  scenarioId,
  expressionId,
  date,
}: ExpressionFlowProps) => {
  const router = useRouter();
  const [step, setStep] = useState<'QUIZ' | 'EXPLAIN' | 'REVIEW'>('QUIZ');
  // 예문까지(QUIZ·EXPLAIN)는 뒤로가기 대신 X로 나가며, 중단 확인 시트를 먼저 띄운다
  const [exitOpen, setExitOpen] = useState(false);
  // 복습 영작 draft — 예문(설명)을 보러 나갔다 돌아와도 고른 칩이 유지되게 문제 문장과 함께 보관한다
  const [reviewDraft, setReviewDraft] = useState<{
    sentence: string;
    selected: number[];
  } | null>(null);

  // 플로우 전체(퀴즈·설명·복습)는 대표 예문(learning-start)만으로 굴러간다.
  // 추가 예문(practice)은 설명 스텝의 "이렇게도 써요"에만 쓰는 보강 데이터라, 없거나 실패해도 플로우를 막지 않는다.
  const {
    learning,
    error: learningError,
    isLoading: learningLoading,
  } = useExpressionLearningQuery(expressionId);
  // learning이 오면(=QUIZ 진입) 예문을 미리 받아, QUIZ 체류 중 EXPLAIN용 practice를 데워둔다.
  const { practice, isLoading: practiceLoading } = useExpressionPracticeQuery(
    expressionId,
    !!learning,
  );
  const finish = useFinishExpressionMutation(expressionId);

  // 데이터가 준비돼 실제 학습이 뜬 시점을 시작으로 본다
  const learningReady = Boolean(learning);
  useEffect(() => {
    if (!learningReady) return;
    track(EVENTS.EXPRESSION_LEARNING_STARTED, {
      expression_id: expressionId,
      scenario_id: scenarioId,
    });
  }, [learningReady, expressionId, scenarioId]);

  // 첫 스텝(QUIZ) 포함, 스텝 전환마다 노출로 기록한다
  useEffect(() => {
    if (!learningReady) return;
    track(EVENTS.EXPRESSION_STEP_VIEWED, {
      expression_id: expressionId,
      step: STEP_PROP[step],
    });
  }, [learningReady, step, expressionId]);

  // 예문 이미지는 QUIZ→EXPLAIN에서 마운트되지만, URL을 아는 즉시 브라우저 캐시에 선로드해
  // EXPLAIN 도착 시 img가 곧바로 뜨게 한다. preload는 멱등이라 렌더 중 호출해도 안전하다.
  for (const url of collectPreloadImageUrls(practice)) {
    preload(url, { as: 'image' });
  }

  // 학습을 나가면 홈으로 돌아가 해당 카드를 뒤집어(뒷면=표현 리스트) 보여준다.
  // replace로 표현학습을 히스토리에서 지워, 홈에서 뒤로가기 시 퀴즈로 재진입하지 않게 한다.
  const backToList = () =>
    router.replace(scenarioReturnPath({ flip: scenarioId, date }));

  if (learningLoading) return <QuizStepSkeleton />;
  if (learningError || !learning) {
    return (
      <FlowStatus>
        {learningError?.message ?? '표현을 불러오지 못했어요.'}
      </FlowStatus>
    );
  }

  const quiz = fromLearning(learning);

  const openExitSheet = () => {
    track(EVENTS.CONFIRM_SHEET_OPENED, { sheet: 'expression_exit' });
    setExitOpen(true);
  };

  // 중단 확인 시트 — QUIZ·EXPLAIN에서 X를 누르면 뜬다. 확인 시 완료 처리 없이 리스트로.
  const exitSheet = (
    <ExpressionExitSheet
      open={exitOpen}
      onConfirm={() => {
        track(EVENTS.EXPRESSION_ABANDONED, {
          expression_id: expressionId,
          step: STEP_PROP[step],
        });
        backToList();
      }}
      onClose={() => {
        track(EVENTS.CONFIRM_SHEET_DISMISSED, { sheet: 'expression_exit' });
        setExitOpen(false);
      }}
    />
  );

  if (step === 'QUIZ') {
    return (
      <>
        <QuizStep
          quiz={quiz}
          expressionId={expressionId}
          leftAction="close"
          onBack={openExitSheet}
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
          expressionId={expressionId}
          targetExpressionText={learning.targetExpressionText}
          baseExpressionMeaningText={learning.baseExpressionMeaningText}
          usageDescription={learning.usageDescription}
          examples={practice?.practiceSentence ?? []}
          title={learning.baseExpressionMeaningText}
          progress={EXPLAIN_PROGRESS}
          nextLabel="복습 퀴즈 풀게요"
          leftAction="close"
          onBack={openExitSheet}
          onNext={() => setStep('REVIEW')}
        />
        {exitSheet}
      </>
    );
  }

  // 복습 영작 — practice가 주는 별도 영작 문제(writingSentence)를 QUIZ와 같은 단어 칩 방식으로 푼다.
  // 아직 로딩 중이면 잠깐 스켈레톤을 유지한다 — 폴백 문제를 먼저 보여줬다가 도착 후 바꿔치기하면
  // 고른 칩과 단어 수가 어긋난다. 실패(404 등) 시에만 대표 예문으로 폴백해 플로우를 막지 않는다.
  if (practiceLoading && !practice) return <QuizStepSkeleton />;
  const reviewQuiz = practice?.writingSentence
    ? fromWritingSentence(practice.writingSentence)
    : quiz;

  const finishFlow = () =>
    finish.mutate(undefined, {
      onSuccess: () => {
        track(EVENTS.EXPRESSION_COMPLETED, {
          expression_id: expressionId,
          scenario_id: scenarioId,
        });
        backToList();
      },
    });

  return (
    <QuizStep
      // 문제가 바뀌면(이론상 폴백→practice 교체) 상태를 통째로 리셋한다
      key={reviewQuiz.writingSentenceText}
      quiz={reviewQuiz}
      expressionId={expressionId}
      onBack={() => setStep('EXPLAIN')}
      onNext={finishFlow}
      nextLabel="학습 완료"
      finishing={finish.isPending}
      progressRange={[EXPLAIN_PROGRESS, 1]}
      // 예문을 보러 나갔다 돌아와도 같은 문제면 고른 칩을 이어서 쓴다
      initialSelected={
        reviewDraft?.sentence === reviewQuiz.writingSentenceText
          ? reviewDraft.selected
          : undefined
      }
      onSelectedChange={(selected) =>
        setReviewDraft({ sentence: reviewQuiz.writingSentenceText, selected })
      }
      correctSlot={() => (
        <ReviewSuccess
          expression={learning.targetExpressionText}
          meaning={learning.baseExpressionMeaningText}
          onFinish={finishFlow}
          finishing={finish.isPending}
        />
      )}
    />
  );
};

const FlowStatus = ({ children }: { children: React.ReactNode }) => (
  <div className="mx-auto flex h-dvh max-w-[430px] items-center justify-center bg-background px-6 text-center text-sm font-medium text-muted-foreground">
    {children}
  </div>
);
