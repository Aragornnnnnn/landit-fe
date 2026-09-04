'use client';

// 표현학습 플로우 — 단어 선택 퀴즈(D안 ①') → [발음 자산 있으면: 표현 설명(D안 ④) → 발음 평가] → 추가 예문 → 복습 영작 2문제(D안 ⑤) → 완료 처리 후 리스트로.
import { useEffect, useState } from 'react';
import { EVENTS, type ExpressionStep } from '@landit/analytics';
import { useRouter } from 'next/navigation';
import { preload } from 'react-dom';

import { track } from '@/shared/analytics';
import { scenarioReturnPath, smallTalkHistoryPath } from '@/shared/lib/routes';

import type { ExpressionLearning } from '../api/learning';
import type { ExpressionPractice } from '../api/practice';
import { collectPreloadImageUrls } from '../lib/preload-images';
import { pickRandomPartner } from '../model/quiz-partner';
import { fromLearning, fromWritingSentence } from '../model/sentence-quiz';
import { useExpressionIntroStepAudio } from '../model/useExpressionIntroStepAudio';
import { useExpressionLearningQuery } from '../model/useExpressionLearningQuery';
import { useExpressionPracticeQuery } from '../model/useExpressionPracticeQuery';
import { useFinishExpressionMutation } from '../model/useFinishExpressionMutation';
import { ExpressionExitSheet } from './common/ExpressionExitSheet';
import { ExamplesStep } from './learning/ExamplesStep';
import { ExpressionIntroStep } from './learning/ExpressionIntroStep';
import { QuizStep } from './learning/QuizStep';
import { ReviewStep } from './learning/ReviewStep';
import { PronunciationStep } from './pronunciation/PronunciationStep';
import { QuizStepSkeleton } from './QuizStepSkeleton';

// 이 표현이 어디서 왔는지 — 나갈 때 돌아갈 곳과 계측에 싣는 출처가 여기서 갈린다.
// 시나리오 표현은 콘텐츠에 붙어 있어 그 날 카드로 돌아가고, 스몰톡 표현은 그 대화의 표현 목록으로 돌아간다
export type ExpressionOrigin =
  // 어느 날 카드에서 들어왔는지도 함께 — 나갈 때 그 날 카드로 돌려보낸다
  | { kind: 'scenario'; scenarioId: number; date?: string }
  | { kind: 'session'; sessionId: number };

interface ExpressionFlowProps {
  origin: ExpressionOrigin;
  expressionId: number;
}

// 화면 스텝 — EXPLAIN(설명)·PRONOUNCE(발음 평가)는 발음 자산이 있는 표현에만, EXAMPLES(추가 예문)는 예문을 받았을 때만 낀다.
// 발음 없는 표현은 설명 화면 없이 퀴즈→예문→복습이다 (설명 카드만 있는 화면은 굳이 두지 않는다)
type Step = 'QUIZ' | 'EXPLAIN' | 'PRONOUNCE' | 'EXAMPLES' | 'REVIEW';

// 화면 스텝 → 이벤트 속성 값
const STEP_PROP: Record<Step, ExpressionStep> = {
  QUIZ: 'quiz',
  EXPLAIN: 'explain',
  PRONOUNCE: 'pronounce',
  EXAMPLES: 'examples',
  REVIEW: 'review',
};

// 진행바 배치 — 예문이 멈추는 지점. 복습이 여기서 1까지 이어받아 채운다
const EXAMPLES_PROGRESS = 0.7;
// 발음 스텝이 낀 플로우의 앞쪽 구간 배치 — 퀴즈(0~0.3)→설명(0.45)→발음(0.6)→예문→복습
const QUIZ_RANGE_WITH_PRONUNCIATION: [number, number] = [0, 0.3];
const EXPLAIN_PROGRESS_WITH_PRONUNCIATION = 0.45;
const PRONUNCIATION_PROGRESS = 0.6;

// 데이터 로딩 껍데기 — learning이 준비된 뒤에만 본체를 마운트한다.
// 본체가 learning을 항상 들고 시작하므로 시작 스텝을 useState 초기값으로 자연스럽게 정할 수 있다
export const ExpressionFlow = ({
  origin,
  expressionId,
}: ExpressionFlowProps) => {
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

  // 데이터가 있으면 본체를 유지한다 — 백그라운드 리페치가 실패해도(에러가 서도)
  // 진행 중인 학습 상태(step·피드백 등)를 리셋하지 않는다
  if (learning) {
    return (
      <LoadedExpressionFlow
        origin={origin}
        expressionId={expressionId}
        learning={learning}
        practice={practice}
        practiceLoading={practiceLoading}
      />
    );
  }
  if (learningLoading) return <QuizStepSkeleton />;
  return (
    <FlowStatus>
      {learningError?.message ?? '표현을 불러오지 못했어요.'}
    </FlowStatus>
  );
};

interface LoadedExpressionFlowProps {
  origin: ExpressionOrigin;
  expressionId: number;
  learning: ExpressionLearning;
  practice: ExpressionPractice | null;
  practiceLoading: boolean;
}

const LoadedExpressionFlow = ({
  origin,
  expressionId,
  learning,
  practice,
  practiceLoading,
}: LoadedExpressionFlowProps) => {
  const router = useRouter();
  // 계측에 싣는 출처 — 시나리오면 시나리오 id, 스몰톡이면 세션 id
  const originProps =
    origin.kind === 'scenario'
      ? { scenario_id: origin.scenarioId }
      : { session_id: origin.sessionId };
  // 발음 자산(원어민 TTS)이 있는 표현만 설명·발음 스텝이 열린다
  const hasPronunciation = Boolean(learning.representativeSentenceAudioUrl);
  // 완료한 표현의 재진입은 퀴즈를 건너뛰고 퀴즈 다음 화면(설명, 발음 없으면 예문)부터 시작한다 — 판정은 서버(learning.completed) 한 곳.
  // EXAMPLES는 "예문을 볼 차례"라는 뜻이고, 실제로 예문을 보여줄지는 아래 visibleStep이 practice 도착 뒤에 정한다
  const [step, setStep] = useState<Step>(() => {
    if (!learning.completed) return 'QUIZ';
    return hasPronunciation ? 'EXPLAIN' : 'EXAMPLES';
  });
  // 발음 분석이 결과 화면(피드백·실패)에 한 번이라도 도달했는지 — 그 뒤 설명·예문으로 나가도
  // 발음 스텝을 숨김 유지해 보던 화면을 잃지 않고, 설명 CTA는 "다음"으로 바뀐다.
  // 녹음 전에 되돌아가는 건 그냥 첫 방문 취급
  const [pronounceDone, setPronounceDone] = useState(false);
  // 발음을 결과 없이 지나갔는지(사용자 건너뛰기 또는 자산 소실 404) — 이 상태에선 예문의 뒤로가기가
  // 마이크 대신 설명(다음 CTA)으로 돌아가고, 설명의 "다음"은 예문으로 복귀한다
  const [pronounceSkipped, setPronounceSkipped] = useState(false);
  // 되돌아갈 앞 화면이 없는 스텝(QUIZ·EXPLAIN, 발음 없으면 EXAMPLES까지)은 X로 나가며, 중단 확인 시트를 먼저 띄운다
  const [exitOpen, setExitOpen] = useState(false);
  // 퀴즈에서 질문을 건네는 상대 — 들어올 때 한 번만 뽑는다 (복습은 문제마다 ReviewStep이 따로 뽑는다)
  const [partner] = useState(() => pickRandomPartner());
  // 예문에서 복습으로 넘어간 적이 있는지 — 그 뒤 예문을 다시 보러 나가도 복습 스텝을 숨김 유지해 고른 칩과 큐를 잃지 않는다
  const [reviewVisited, setReviewVisited] = useState(false);

  // 스몰톡 표현은 완료 요청에 세션 ID를 실어야 서버가 기록한다
  const finish = useFinishExpressionMutation(
    expressionId,
    origin.kind === 'session' ? origin.sessionId : undefined,
  );
  // 설명 화면(B안)의 소리 배선 — 자동재생·스피커 토글·진행률·계측 (자세한 규칙은 훅 참고)
  const introAudio = useExpressionIntroStepAudio({
    active: step === 'EXPLAIN',
    expressionId,
    sentenceAudioUrl: learning.representativeSentenceAudioUrl,
    expressionAudioUrl: learning.targetExpressionAudioUrl,
  });

  // 실제 학습이 뜬 시점(본체 마운트)을 시작으로 본다
  useEffect(() => {
    track(EVENTS.EXPRESSION_LEARNING_STARTED, {
      expression_id: expressionId,
      ...originProps,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [expressionId]);

  const quiz = fromLearning(learning);
  // 결과 없이 건너뛴 상태 — 재방문 동선이 발음(마이크) 대신 설명↔예문을 오간다
  const skippedWithoutResult = pronounceSkipped && !pronounceDone;
  // practice가 결론이 났는지(도착했거나 실패했거나) — 아직이면 예문·복습 자리에 스켈레톤을 둔다
  const practiceSettled = !(practiceLoading && !practice);
  const examples = practice?.practiceSentence ?? [];
  // 실제로 보여줄 스텝 — 예문 차례인데 결론 난 practice에 예문이 없으면(미시딩·404) 예문 화면을 건너뛰고 복습이다.
  // step 자체를 바꾸지 않아 practice가 늦게 와도 예문을 놓치지 않고, 계측도 이 값을 쓴다
  const visibleStep: Step =
    step === 'EXAMPLES' && practiceSettled && examples.length === 0
      ? 'REVIEW'
      : step;

  // 첫 스텝 포함, 스텝 전환마다 노출로 기록한다
  useEffect(() => {
    track(EVENTS.EXPRESSION_STEP_VIEWED, {
      expression_id: expressionId,
      step: STEP_PROP[visibleStep],
    });
  }, [visibleStep, expressionId]);

  // 예문 이미지는 EXAMPLES에서 마운트되지만, URL을 아는 즉시 브라우저 캐시에 선로드해
  // 도착 시 img가 곧바로 뜨게 한다. preload는 멱등이라 렌더 중 호출해도 안전하다.
  for (const url of collectPreloadImageUrls(practice)) {
    preload(url, { as: 'image' });
  }

  // 학습을 나가면 그 표현이 서 있던 목록으로 돌아간다 — 시나리오는 홈 카드를 뒤집어(뒷면=표현 리스트),
  // 스몰톡은 그 대화의 기록으로 (대화 직후 결과 화면은 축하가 붙은 1회용이라 돌아갈 자리가 아니다)
  const listPath =
    origin.kind === 'scenario'
      ? scenarioReturnPath({ flip: origin.scenarioId, date: origin.date })
      : smallTalkHistoryPath(origin.sessionId);
  // 중도 이탈(그만두기·뒤로가기)은 곧장 목록으로. replace로 표현학습을 히스토리에서 지워 뒤로가기로 퀴즈에 재진입하지 않게 한다
  const backToList = () => router.replace(listPath);

  const openExitSheet = () => {
    track(EVENTS.CONFIRM_SHEET_OPENED, { sheet: 'expression_exit' });
    setExitOpen(true);
  };

  // 예문·복습에서 뒤로 — 발음 결과가 있으면 그 화면으로, 결과 없이 지나갔으면 설명으로(말하기를 강요하는
  // 화면이 불쑥 뜨지 않게). 발음 없는 표현은 앞 화면이 퀴즈뿐이라 되돌리지 않고 나가기 확인을 띄운다
  const backBeforeExamples = () => {
    if (!hasPronunciation) return openExitSheet();
    setStep(skippedWithoutResult ? 'EXPLAIN' : 'PRONOUNCE');
  };
  // 예문·복습이 플로우의 첫 되돌림 지점일 때는 ‹ 대신 X다
  const closeInsteadOfBack = !hasPronunciation;

  // 중단 확인 시트 — QUIZ·EXPLAIN에서 X를 누르면 뜬다. 확인 시 완료 처리 없이 리스트로.
  const exitSheet = (
    <ExpressionExitSheet
      open={exitOpen}
      onConfirm={() => {
        track(EVENTS.EXPRESSION_ABANDONED, {
          expression_id: expressionId,
          step: STEP_PROP[visibleStep],
        });
        backToList();
      }}
      onClose={() => {
        track(EVENTS.CONFIRM_SHEET_DISMISSED, { sheet: 'expression_exit' });
        setExitOpen(false);
      }}
    />
  );

  // 복습 영작 — practice가 주는 작문 문제 2건(영어·한국어)을 QUIZ와 같은 단어 칩 방식으로 차례로 푼다.
  // 아직 로딩 중이면 잠깐 스켈레톤을 유지한다 — 폴백 문제를 먼저 보여줬다가 도착 후 바꿔치기하면
  // 고른 칩과 단어 수가 어긋난다. 실패(404 등) 시에만 대표 예문 1문제로 폴백해 플로우를 막지 않는다.
  // 옛 응답(객체)이나 빈 값도 폴백으로 흘러 프론트가 먼저 배포돼도 깨지지 않는다
  const reviewQuizzes = practice?.writingSentence?.length
    ? practice.writingSentence.map(fromWritingSentence)
    : [quiz];

  const finishFlow = () =>
    finish.mutate(undefined, {
      onSuccess: () => {
        track(EVENTS.EXPRESSION_COMPLETED, {
          expression_id: expressionId,
          ...originProps,
        });
        router.replace(listPath);
      },
    });

  // 발음 keep-alive 트리와 3스텝 플로우가 같은 화면을 쓴다.
  // 문제 목록이 바뀌면(폴백→실제 문제 도착) key로 큐를 새로 세운다 — 큐 인덱스가 목록에 묶여 있어서다
  const reviewScreen = practiceSettled ? (
    <ReviewStep
      key={reviewQuizzes.map((item) => item.answerText).join('\n')}
      quizzes={reviewQuizzes}
      expressionId={expressionId}
      // 예문을 봤으면 예문으로, 예문이 없었으면 그 앞 화면으로
      onBack={() =>
        examples.length > 0 ? setStep('EXAMPLES') : backBeforeExamples()
      }
      leftAction={
        examples.length === 0 && closeInsteadOfBack ? 'close' : 'back'
      }
      progressStart={EXAMPLES_PROGRESS}
      expression={learning.targetExpressionText}
      meaning={learning.baseExpressionMeaningText}
      onFinish={finishFlow}
      finishing={finish.isPending}
    />
  ) : (
    <QuizStepSkeleton />
  );
  // 예문을 거쳐 복습에 들어왔으면 예문으로 나가도 숨김 유지 — 돌아오면 고른 칩과 큐가 그대로다
  const reviewSlot = (visibleStep === 'REVIEW' || reviewVisited) && (
    <div className={visibleStep === 'REVIEW' ? undefined : 'hidden'}>
      {reviewScreen}
    </div>
  );

  // 추가 예문 — 발음 keep-alive 트리와 3스텝 플로우가 같은 화면을 쓴다. practice가 아직이면 스켈레톤으로 기다린다
  const exampleScreen = practiceSettled ? (
    <ExamplesStep
      expressionId={expressionId}
      examples={examples}
      title={learning.baseExpressionMeaningText}
      progress={EXAMPLES_PROGRESS}
      onBack={backBeforeExamples}
      leftAction={closeInsteadOfBack ? 'close' : 'back'}
      onNext={() => {
        setReviewVisited(true);
        setStep('REVIEW');
      }}
    />
  ) : (
    <QuizStepSkeleton />
  );

  if (step === 'QUIZ') {
    return (
      <>
        <QuizStep
          step="quiz"
          quiz={quiz}
          partner={partner}
          expressionId={expressionId}
          leftAction="close"
          onBack={openExitSheet}
          onNext={() => setStep(hasPronunciation ? 'EXPLAIN' : 'EXAMPLES')}
          progressRange={
            hasPronunciation ? QUIZ_RANGE_WITH_PRONUNCIATION : undefined
          }
        />
        {exitSheet}
      </>
    );
  }

  // 발음 자산이 있으면 QUIZ 이후 스텝 전부(설명·발음·추가 예문·복습)를 한 트리에서 렌더한다 (QUIZ는 위에서 반환됨).
  // 피드백을 받은 뒤엔 어느 스텝으로 나가도 발음 스텝은 숨김 유지 — 리마운트되면 피드백·녹음이 날아간다
  if (learning.representativeSentenceAudioUrl) {
    // 발음 스텝을 지나온 재방문 — 설명 CTA가 "다음"(복귀)으로 바뀌고 건너뛰기는 사라진다
    const pronounceRevisit = pronounceDone || pronounceSkipped;
    return (
      <>
        {step === 'EXPLAIN' && (
          <ExpressionIntroStep
            targetExpressionText={learning.targetExpressionText}
            baseExpressionMeaningText={learning.baseExpressionMeaningText}
            usageDescription={learning.usageDescription}
            sentenceText={learning.representativeSentenceText}
            sentenceTranslation={learning.representativeSentenceTranslation}
            imageUrl={learning.representativeImageUrl}
            // 듣기 배선(자동재생·토글·진행률·계측)은 훅이 만든 props 그대로
            {...introAudio}
            progress={EXPLAIN_PROGRESS_WITH_PRONUNCIATION}
            leftAction="close"
            onBack={openExitSheet}
            // 재방문의 "다음"은 떠나온 자리로 복귀 — 발음 결과가 있으면 그 화면, 건너뛰었으면 예문
            onNext={() =>
              setStep(skippedWithoutResult ? 'EXAMPLES' : 'PRONOUNCE')
            }
            nextLabel={pronounceRevisit ? '다음' : undefined}
            // 마이크를 쓸 수 없는 상황(장소 등)을 위한 발음 건너뛰기 — 기획 확정 동선. 재방문 땐 없다
            onSkip={
              pronounceRevisit
                ? undefined
                : () => {
                    track(EVENTS.PRONUNCIATION_SKIPPED, {
                      expression_id: expressionId,
                    });
                    setPronounceSkipped(true);
                    setStep('EXAMPLES');
                  }
            }
          />
        )}
        {visibleStep === 'EXAMPLES' && exampleScreen}
        {reviewSlot}
        {(step === 'PRONOUNCE' || pronounceDone) && (
          <div className={step === 'PRONOUNCE' ? undefined : 'hidden'}>
            <PronunciationStep
              active={step === 'PRONOUNCE'}
              onSettled={() => setPronounceDone(true)}
              expressionId={expressionId}
              sentenceText={learning.representativeSentenceText}
              sentenceTranslation={learning.representativeSentenceTranslation}
              targetExpressionText={learning.targetExpressionText}
              imageUrl={learning.representativeImageUrl}
              sentenceAudioUrl={learning.representativeSentenceAudioUrl}
              progress={PRONUNCIATION_PROGRESS}
              onBack={() => setStep('EXPLAIN')}
              onExit={openExitSheet}
              onNext={() => setStep('EXAMPLES')}
              // 자산 소실(404)도 발음을 못 거친 채 지나가는 경우 — 건너뛰기 동선을 재사용해
              // 뒤로가기가 죽은 발음 화면으로 되돌아가지 않게 한다
              onUnavailable={() => {
                setPronounceSkipped(true);
                setStep('EXAMPLES');
              }}
            />
          </div>
        )}
        {exitSheet}
      </>
    );
  }

  // 발음 없는 표현 — 퀴즈 뒤는 예문·복습뿐
  return (
    <>
      {visibleStep === 'EXAMPLES' && exampleScreen}
      {reviewSlot}
      {exitSheet}
    </>
  );
};

const FlowStatus = ({ children }: { children: React.ReactNode }) => (
  <div className="mx-auto flex h-dvh max-w-[430px] items-center justify-center bg-background px-6 text-center text-sm font-medium text-muted-foreground">
    {children}
  </div>
);
