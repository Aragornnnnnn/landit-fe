'use client';

// 설문 플로우 — 안내 → 문항 하나씩 → 완료. 온보딩처럼 한 화면에 한 문항, 옆으로 넘긴다
import { useState } from 'react';
import { useRouter } from 'next/navigation';

import { useAuthStore } from '@/shared/auth/auth-store';
import { homePath } from '@/shared/lib/last-tab';
import { MAILBOX_PATH } from '@/shared/lib/routes';
import { useKeyboardInset } from '@/shared/lib/useKeyboardInset';
import { Transition } from '@/shared/motion';
import { showToast } from '@/shared/ui/toast';

import { submitSurvey } from '../api/survey';
import {
  toSubmission,
  visibleQuestions,
  type Answer,
  type Answers,
} from '../model/answers';
import { otherKey, QUESTIONS } from '../model/questions';
import { surveyDone } from '../model/survey-done';
import { QuestionStep } from './QuestionStep';
import { SurveyDone } from './SurveyDone';
import { SurveyHeader } from './SurveyHeader';
import { SurveyIntro } from './SurveyIntro';

// 숫자는 몇 번째 문항인지
type Step = 'intro' | 'done' | number;

export const SurveyFlow = () => {
  const router = useRouter();
  const member = useAuthStore((state) => state.member);
  const keyboardInset = useKeyboardInset();

  // 이미 마친 기기면 문항을 다시 묻지 않는다
  const [step, setStep] = useState<Step>(() =>
    surveyDone.has() ? 'done' : 'intro',
  );
  const [direction, setDirection] = useState(1);
  const [answers, setAnswers] = useState<Answers>({});
  const [submitting, setSubmitting] = useState(false);
  // 조건 문항이 끼고 빠지므로 스텝 번호는 이 목록 기준이다
  const questions = visibleQuestions(QUESTIONS, answers);

  const goTo = (next: Step, dir: number) => {
    setDirection(dir);
    setStep(next);
  };

  // 편지에서 넘어온 화면이라 되짚어 간다. 주소로 바로 열었으면 편지함으로
  const leave = () =>
    window.history.length > 1 ? router.back() : router.replace(MAILBOX_PATH);

  const stepBack = () => {
    if (step === 'intro') leave();
    else if (step === 0) goTo('intro', -1);
    else if (typeof step === 'number') goTo(step - 1, -1);
  };

  const answer = (id: string, value: Answer) =>
    setAnswers((prev) => ({ ...prev, [id]: value }));

  const submit = async () => {
    if (!member || submitting) return;
    setSubmitting(true);
    try {
      // 이미 참여한 사람(duplicate)도 완료 화면으로 — 두 번 낼 수 없다는 걸 따로 설명할 이유가 없다
      await submitSurvey(member.email, toSubmission(QUESTIONS, answers));
      surveyDone.mark();
      goTo('done', 1);
    } catch {
      showToast('저장하지 못했어요. 잠시 후 다시 시도해 주세요.');
    } finally {
      setSubmitting(false);
    }
  };

  // 단일 선택은 살짝 늦게 넘어가므로, 그 사이 다른 스텝으로 옮겼으면 무시한다
  const advanceFrom = (index: number) => {
    if (step !== index) return;
    if (index === questions.length - 1) void submit();
    else goTo(index + 1, 1);
  };

  const transitionKey = typeof step === 'number' ? `question-${step}` : step;

  return (
    // 키보드가 가린 만큼 줄인다 — 주관식 입력창과 제출 버튼이 키보드 뒤로 숨지 않게
    <main
      style={{ height: `calc(100dvh - ${keyboardInset}px)` }}
      className="relative mx-auto flex max-w-[430px] flex-col overflow-hidden bg-background text-foreground"
    >
      {step !== 'done' && (
        <SurveyHeader
          questionIndex={typeof step === 'number' ? step : null}
          questionCount={questions.length}
          onBack={stepBack}
        />
      )}

      <Transition
        transitionKey={transitionKey}
        direction={direction}
        className="flex min-h-0 flex-1 flex-col px-6"
        style={{
          paddingTop: 'calc(max(env(safe-area-inset-top), 18px) + 58px)',
          paddingBottom: 'max(env(safe-area-inset-bottom), 20px)',
        }}
      >
        {step === 'intro' && <SurveyIntro onStart={() => goTo(0, 1)} />}
        {typeof step === 'number' && (
          <QuestionStep
            question={questions[step]}
            answer={answers[questions[step].id]}
            otherText={String(answers[otherKey(questions[step].id)] ?? '')}
            isLast={step === questions.length - 1}
            submitting={submitting}
            onAnswer={(value) => answer(questions[step].id, value)}
            onOtherText={(text) => answer(otherKey(questions[step].id), text)}
            onNext={() => advanceFrom(step)}
          />
        )}
        {step === 'done' && (
          <SurveyDone onGoHome={() => router.replace(homePath())} />
        )}
      </Transition>
    </main>
  );
};
