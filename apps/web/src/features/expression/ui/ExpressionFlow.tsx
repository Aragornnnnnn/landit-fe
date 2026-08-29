'use client';

// 표현학습 플로우 — 단어 선택 퀴즈(D안 ①') → 표현 설명(D안 ④) → [발음 자산 있으면: 발음 평가 → 추가 예문] → 복습 영작(D안 ⑤) → 완료 처리 후 리스트로.
import { useEffect, useRef, useState } from 'react';
import { EVENTS, type ExpressionStep } from '@landit/analytics';
import { useRouter } from 'next/navigation';
import { preload } from 'react-dom';

import { track } from '@/shared/analytics';
import { scenarioReturnPath, smallTalkHistoryPath } from '@/shared/lib/routes';

import { collectPreloadImageUrls } from '../lib/preload-images';
import { fromLearning, fromWritingSentence } from '../model/sentence-quiz';
import { useAudioPlayer } from '../model/useAudioPlayer';
import { useExpressionLearningQuery } from '../model/useExpressionLearningQuery';
import { useExpressionPracticeQuery } from '../model/useExpressionPracticeQuery';
import { useFinishExpressionMutation } from '../model/useFinishExpressionMutation';
import { ExpressionExitSheet } from './common/ExpressionExitSheet';
import { ExplanationStep } from './learning/ExplanationStep';
import { ExpressionIntroStep } from './learning/ExpressionIntroStep';
import { QuizStep } from './learning/QuizStep';
import { ReviewSuccess } from './practice/ReviewSuccess';
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

// 화면 스텝 — PRONOUNCE(발음 평가)·EXAMPLES(발음 뒤 추가 예문)는 발음 자산이 있는 표현에만 낀다
type Step = 'QUIZ' | 'EXPLAIN' | 'PRONOUNCE' | 'EXAMPLES' | 'REVIEW';

// 화면 스텝 → 이벤트 속성 값
const STEP_PROP: Record<Step, ExpressionStep> = {
  QUIZ: 'quiz',
  EXPLAIN: 'explain',
  PRONOUNCE: 'pronounce',
  EXAMPLES: 'examples',
  REVIEW: 'review',
};

// EXPLAIN(추가 예문 포함 화면)이 멈추는 진행바 지점 — REVIEW가 이 지점부터 이어받아 1까지 채운다
const EXPLAIN_PROGRESS = 0.7;
// 발음 스텝이 낀 플로우의 앞쪽 구간 배치 — 퀴즈(0~0.3)→설명(0.45)→발음(0.6)→추가 예문(0.7)
const QUIZ_RANGE_WITH_PRONUNCIATION: [number, number] = [0, 0.3];
const EXPLAIN_PROGRESS_WITH_PRONUNCIATION = 0.45;
const PRONUNCIATION_PROGRESS = 0.6;
// 설명 화면 자동재생에서 표현 → 예문 사이 숨 고르는 텀
const INTRO_GAP_MS = 600;

export const ExpressionFlow = ({
  origin,
  expressionId,
}: ExpressionFlowProps) => {
  const router = useRouter();
  // 계측에 싣는 출처 — 시나리오면 시나리오 id, 스몰톡이면 세션 id
  const originProps =
    origin.kind === 'scenario'
      ? { scenario_id: origin.scenarioId }
      : { session_id: origin.sessionId };
  const [step, setStep] = useState<Step>('QUIZ');
  // 발음 분석이 결과 화면(피드백·실패)에 한 번이라도 도달했는지 — 그 뒤 설명·추가 예문으로 나가도
  // 발음 스텝을 숨김 유지해 보던 화면을 잃지 않고, 설명 CTA는 "다음"으로 바뀐다.
  // 녹음 전에 되돌아가는 건 그냥 첫 방문 취급
  const [pronounceDone, setPronounceDone] = useState(false);
  // 발음을 건너뛰었는지 — 추가 예문에서 뒤로 가면 마이크가 아니라 설명(다음 CTA)으로 돌아가고,
  // 설명의 "다음"은 발음이 아니라 추가 예문으로 복귀한다
  const [pronounceSkipped, setPronounceSkipped] = useState(false);
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
  // 스몰톡 표현은 완료 요청에 세션 ID를 실어야 서버가 기록한다
  const finish = useFinishExpressionMutation(
    expressionId,
    origin.kind === 'session' ? origin.sessionId : undefined,
  );
  // 설명 화면(B안)의 원어민 발음 듣기 재생용
  const player = useAudioPlayer();
  // 설명 화면 첫 진입 시 표현 → 예문 순서로 자동 1회 들려준다 — 발음 화면에서 되돌아와도 다시 틀지 않고,
  // 중간에 사용자가 끄면(stopped) 다음 재생을 잇지 않는다. 표현 전용 음원이 없으면 예문만 튼다
  const introPlayedRef = useRef(false);
  // 표현→예문 사이 숨 고르는 텀 — 사용자가 그 사이 다른 듣기를 누르면 취소한다
  const introGapTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const clearIntroGap = () => {
    if (introGapTimerRef.current) clearTimeout(introGapTimerRef.current);
    introGapTimerRef.current = null;
  };
  useEffect(() => clearIntroGap, []);

  const introAudioUrl = learning?.representativeSentenceAudioUrl ?? null;
  const introExpressionAudioUrl = learning?.targetExpressionAudioUrl ?? null;
  useEffect(() => {
    if (step !== 'EXPLAIN') {
      // 설명 화면을 떠나면 자동재생과 예약된 다음 재생을 끊는다 — 발음 녹음 화면에 소리가 새지 않게
      clearIntroGap();
      player.stop();
      return;
    }
    if (introPlayedRef.current || !introAudioUrl) return;
    introPlayedRef.current = true;
    if (introExpressionAudioUrl) {
      player.play(introExpressionAudioUrl, {
        id: 'intro-expression',
        onDone: (reason) => {
          if (reason !== 'ended') return;
          introGapTimerRef.current = setTimeout(() => {
            player.play(introAudioUrl, { id: 'intro-sentence' });
          }, INTRO_GAP_MS);
        },
      });
    } else {
      player.play(introAudioUrl, { id: 'intro-sentence' });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- 진입 시 1회, player는 안정적이지 않아 제외
  }, [step, introAudioUrl, introExpressionAudioUrl]);

  // 데이터가 준비돼 실제 학습이 뜬 시점을 시작으로 본다
  const learningReady = Boolean(learning);
  useEffect(() => {
    if (!learningReady) return;
    track(EVENTS.EXPRESSION_LEARNING_STARTED, {
      expression_id: expressionId,
      ...originProps,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [learningReady, expressionId]);

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

  // 학습을 나가면 그 표현이 서 있던 목록으로 돌아간다 — 시나리오는 홈 카드를 뒤집어(뒷면=표현 리스트),
  // 스몰톡은 그 대화의 기록으로 (대화 직후 결과 화면은 축하가 붙은 1회용이라 돌아갈 자리가 아니다). replace로 표현학습을 히스토리에서 지워, 뒤로가기로 퀴즈에 재진입하지 않게 한다
  const backToList = () =>
    router.replace(
      origin.kind === 'scenario'
        ? scenarioReturnPath({ flip: origin.scenarioId, date: origin.date })
        : smallTalkHistoryPath(origin.sessionId),
    );

  if (learningLoading) return <QuizStepSkeleton />;
  if (learningError || !learning) {
    return (
      <FlowStatus>
        {learningError?.message ?? '표현을 불러오지 못했어요.'}
      </FlowStatus>
    );
  }

  const quiz = fromLearning(learning);
  // 발음 자산(원어민 TTS)이 있는 표현만 발음 스텝이 열린다 — null이면 기존 3스텝 플로우 그대로
  const hasPronunciation = Boolean(learning.representativeSentenceAudioUrl);

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

  // 복습 영작 — practice가 주는 별도 영작 문제(writingSentence)를 QUIZ와 같은 단어 칩 방식으로 푼다.
  // 아직 로딩 중이면 잠깐 스켈레톤을 유지한다 — 폴백 문제를 먼저 보여줬다가 도착 후 바꿔치기하면
  // 고른 칩과 단어 수가 어긋난다. 실패(404 등) 시에만 대표 예문으로 폴백해 플로우를 막지 않는다.
  const reviewQuiz = practice?.writingSentence
    ? fromWritingSentence(practice.writingSentence)
    : quiz;

  const finishFlow = () =>
    finish.mutate(undefined, {
      onSuccess: () => {
        track(EVENTS.EXPRESSION_COMPLETED, {
          expression_id: expressionId,
          ...originProps,
        });
        backToList();
      },
    });

  // 발음 keep-alive 트리와 기존 3스텝 폴백이 같은 화면을 쓴다
  const reviewScreen =
    practiceLoading && !practice ? (
      <QuizStepSkeleton />
    ) : (
      <QuizStep
        step="review"
        // 문제가 바뀌면(이론상 폴백→practice 교체) 상태를 통째로 리셋한다
        key={reviewQuiz.writingSentenceText}
        quiz={reviewQuiz}
        expressionId={expressionId}
        onBack={() => setStep(hasPronunciation ? 'EXAMPLES' : 'EXPLAIN')}
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

  if (step === 'QUIZ') {
    return (
      <>
        <QuizStep
          step="quiz"
          quiz={quiz}
          expressionId={expressionId}
          leftAction="close"
          onBack={openExitSheet}
          onNext={() => setStep('EXPLAIN')}
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
    const audioUrl = learning.representativeSentenceAudioUrl;
    // 발음 스텝을 지나온 재방문 — 설명 CTA가 "다음"(복귀)으로 바뀌고 건너뛰기는 사라진다
    const pronounceRevisit = pronounceDone || pronounceSkipped;
    // 결과 없이 건너뛴 상태 — 재방문 동선이 발음(마이크) 대신 설명↔추가 예문을 오간다
    const skippedWithoutResult = pronounceSkipped && !pronounceDone;
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
            // 표현 전용 음원이 없는 표현(패턴형)은 표현 듣기 버튼을 숨긴다 — 예문이 대신 나오면 헷갈린다.
            // toggle이라 재생 중 다시 누르면 꺼지고, 수동 조작은 자동 순차 재생의 대기 타이머를 취소한다
            onPlayExpressionAudio={
              introExpressionAudioUrl
                ? () => {
                    clearIntroGap();
                    // 재생 시작만 찍는다 — 같은 id가 나오는 중이면 이 토글은 끄기다
                    if (player.playingId !== 'intro-expression') {
                      track(EVENTS.PRONUNCIATION_AUDIO_PLAYED, {
                        expression_id: expressionId,
                        source: 'expression',
                      });
                    }
                    player.toggle(introExpressionAudioUrl, {
                      id: 'intro-expression',
                    });
                  }
                : undefined
            }
            playingExpressionAudio={player.playingId === 'intro-expression'}
            expressionAudioProgress={
              player.playingId === 'intro-expression' ? player.progress : 0
            }
            onPlaySentenceAudio={() => {
              clearIntroGap();
              if (player.playingId !== 'intro-sentence') {
                track(EVENTS.PRONUNCIATION_AUDIO_PLAYED, {
                  expression_id: expressionId,
                  source: 'sentence',
                });
              }
              player.toggle(audioUrl, { id: 'intro-sentence' });
            }}
            playingSentenceAudio={player.playingId === 'intro-sentence'}
            sentenceAudioProgress={
              player.playingId === 'intro-sentence' ? player.progress : 0
            }
            progress={EXPLAIN_PROGRESS_WITH_PRONUNCIATION}
            leftAction="close"
            onBack={openExitSheet}
            // 재방문의 "다음"은 떠나온 자리로 복귀 — 발음 결과가 있으면 그 화면, 건너뛰었으면 추가 예문
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
        {/* EXAMPLES — 발음 뒤 추가 예문 화면. 설명 카드는 이미 봤지만 예문 카드의 맥락으로 함께 남긴다 */}
        {step === 'EXAMPLES' && (
          <ExplanationStep
            expressionId={expressionId}
            targetExpressionText={learning.targetExpressionText}
            baseExpressionMeaningText={learning.baseExpressionMeaningText}
            usageDescription={learning.usageDescription}
            examples={practice?.practiceSentence ?? []}
            title={learning.baseExpressionMeaningText}
            progress={EXPLAIN_PROGRESS}
            nextLabel="복습 퀴즈 풀게요"
            // 발음을 건너뛴 사람은 마이크가 아니라 설명으로 되돌린다 — 말하기를 강요하는 화면이 불쑥 뜨지 않게
            onBack={() =>
              setStep(skippedWithoutResult ? 'EXPLAIN' : 'PRONOUNCE')
            }
            onNext={() => setStep('REVIEW')}
            // 설명은 B안 화면에서 이미 봤다 — 여기선 추가 예문만.
            // 예문이 비어 있으면(미시딩·404) 빈 화면 대신 설명 카드를 다시 편다
            showDescription={(practice?.practiceSentence?.length ?? 0) === 0}
          />
        )}
        {step === 'REVIEW' && reviewScreen}
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
              sentenceAudioUrl={audioUrl}
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

  return reviewScreen;
};

const FlowStatus = ({ children }: { children: React.ReactNode }) => (
  <div className="mx-auto flex h-dvh max-w-[430px] items-center justify-center bg-background px-6 text-center text-sm font-medium text-muted-foreground">
    {children}
  </div>
);
