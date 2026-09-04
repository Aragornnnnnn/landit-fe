'use client';

// 설문 플로우 — 안내 → 문항 하나씩 → 완료. 온보딩처럼 한 화면에 한 문항, 옆으로 넘긴다
import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';

import { useAuthStore } from '@/shared/auth/auth-store';
import { homePath } from '@/shared/lib/last-tab';
import { MAILBOX_PATH } from '@/shared/lib/routes';
import { Transition } from '@/shared/motion';
import { showToast } from '@/shared/ui/toast';

import { submitSurvey, warmUpSurveyRoute } from '../api/survey';
import { useKeyboardSafeLayout } from '../lib/useKeyboardSafeLayout';
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
  // 이메일은 쿠폰 줄 때 참고값일 뿐이라 없어도 낸다 — 누구인지는 서버가 토큰으로 정한다
  const email = useAuthStore((state) => state.member?.email ?? null);
  const keyboardInset = useKeyboardSafeLayout();

  // 이미 마친 기기면 문항을 다시 묻지 않는다
  const [step, setStep] = useState<Step>(() =>
    surveyDone.has() ? 'done' : 'intro',
  );
  const [direction, setDirection] = useState(1);
  const [answers, setAnswers] = useState<Answers>({});
  const [submitting, setSubmitting] = useState(false);
  // 지연 콜백(단일 선택의 자동 진행)이 최신 스텝을 읽기 위한 ref — 렌더 시점 값을 잡은 클로저는 뒤로가기를 못 본다
  const stepRef = useRef(step);
  useEffect(() => {
    stepRef.current = step;
  }, [step]);
  useEffect(() => {
    warmUpSurveyRoute();
  }, []);
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

  const recordAnswer = (id: string, value: Answer) =>
    setAnswers((prev) => ({ ...prev, [id]: value }));

  const submit = async () => {
    if (submitting) return;
    setSubmitting(true);
    try {
      // 이미 참여한 사람(duplicate)도 완료 화면으로 — 두 번 낼 수 없다는 걸 따로 설명할 이유가 없다
      await submitSurvey(email, toSubmission(QUESTIONS, answers));
      surveyDone.mark();
      goTo('done', 1);
    } catch {
      showToast('저장하지 못했어요. 잠시 후 다시 시도해 주세요.');
    } finally {
      setSubmitting(false);
    }
  };

  // 단일 선택은 살짝 늦게 넘어가므로, 그 사이 뒤로 갔으면 무시한다.
  // 나가는 화면은 전환이 끝날 때까지 남아 있어 타이머가 그 뒤에도 울린다 — 그래서 state가 아니라 ref를 본다
  const advanceFrom = (index: number) => {
    if (stepRef.current !== index) return;
    if (index === questions.length - 1) void submit();
    else goTo(index + 1, 1);
  };

  // 'intro' · '0'~'11' · 'done' — 서로 겹치지 않으니 그대로 전환 키로 쓴다
  const transitionKey = String(step);

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
            onAnswer={(value) => recordAnswer(questions[step].id, value)}
            onOtherText={(text) =>
              recordAnswer(otherKey(questions[step].id), text)
            }
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
