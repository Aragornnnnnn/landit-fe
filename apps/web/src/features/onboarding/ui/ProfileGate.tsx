// 기존 유저 프로필 질문 게이트 — 온보딩은 이미 마쳤지만 아직 안 답한 질문을 홈 탭 진입 시 무조건 묻는다.
// 신규 유저는 온보딩 스텝에서 이미 답하고 오므로 여기서 다시 뜨지 않는다.
// 화면은 온보딩 스텝을 그대로 다시 쓴다 — 같은 질문을 두 벌로 적어두면 문구가 갈라진다.
// 탭 셸에 심겨 있어 딥링크로 다른 화면에 직행하면 그때는 지나가고, 다음 홈 방문에 막는다
'use client';

import { useEffect, useRef, useState } from 'react';
import {
  EVENTS,
  type AccentLocale,
  type EnglishLevel,
  type GateQuestion,
} from '@landit/analytics';

import { track } from '@/shared/analytics';
import { hasSeenOnboarding } from '@/shared/auth/onboarding-seen';
import { useClientOnlyValue } from '@/shared/lib/useClientOnlyValue';
import { useFocusTrap } from '@/shared/lib/useFocusTrap';

import { collectPendingQuestions } from '../model/profile-gate';
import { useAccentQuery } from '../model/useAccentQuery';
import { useLearningLevelQuery } from '../model/useLearningLevelQuery';
import { useSaveAccentMutation } from '../model/useSaveAccentMutation';
import { useSaveLearningLevelMutation } from '../model/useSaveLearningLevelMutation';
import { StepDots } from './common/StepDots';
import { AccentStep } from './steps/AccentStep';
import { LevelStep } from './steps/LevelStep';

export const ProfileGate = () => {
  const levelQuery = useLearningLevelQuery();
  const accentQuery = useAccentQuery();
  const saveLevel = useSaveLearningLevelMutation();
  const saveAccent = useSaveAccentMutation();
  // 답한 질문은 캐시에 심기는 즉시 아래 목록에서 빠진다 — 이미 답한 것을 따로 들고 있어야 진행점이 원래 개수를 안다
  const [answered, setAnswered] = useState<GateQuestion[]>([]);

  // 온보딩을 아직 안 거친 유저는 온보딩 스텝에서 곧 물으니 여기서는 막지 않는다.
  // 서버엔 localStorage가 없어 하이드레이션이 끝난 뒤에야 읽는다
  const seenOnboarding = useClientOnlyValue(hasSeenOnboarding, false);

  // 질문마다 따로 판단한다 — 한쪽 조회가 실패해도 답을 아는 쪽은 물을 수 있다.
  // 못 받은 쪽은 undefined로 두어 묻지 않는다 (이미 답한 사람에게 또 묻는 게 더 나쁘다)
  const remaining = seenOnboarding
    ? collectPendingQuestions({
        learningLevel: levelQuery.isSuccess
          ? levelQuery.data.learningLevel
          : undefined,
        accentLocale: accentQuery.isSuccess
          ? accentQuery.data.accentLocale
          : undefined,
      })
    : [];
  const question = remaining[0];

  // 화면을 덮기만 하면 키보드·스크린 리더는 뒤의 탭바와 콘텐츠에 그대로 닿는다 — 건너뛸 길이 생기는 셈이다
  const panelRef = useRef<HTMLElement>(null);
  useFocusTrap(question !== undefined, panelRef);

  useEffect(() => {
    if (question) track(EVENTS.PROFILE_GATE_VIEWED, { question });
  }, [question]);

  if (!question) return null;

  const answerLevel = (level: EnglishLevel) => {
    saveLevel.mutate(level);
    track(EVENTS.PROFILE_GATE_ANSWERED, { question: 'level', level });
    setAnswered((prev) => [...prev, 'level']);
  };

  const answerAccent = (accent: AccentLocale) => {
    saveAccent.mutate(accent);
    track(EVENTS.PROFILE_GATE_ANSWERED, { question: 'accent', accent });
    setAnswered((prev) => [...prev, 'accent']);
  };

  // 답한 것 + 남은 것 = 처음에 물으려던 목록
  const questions = [...answered, ...remaining];

  return (
    <main
      ref={panelRef}
      role="dialog"
      aria-modal="true"
      aria-label="시작하기 전에 몇 가지만 알려주세요"
      tabIndex={-1}
      className="fixed inset-0 z-50 mx-auto flex h-dvh max-w-[430px] flex-col overflow-hidden bg-background px-6 text-foreground outline-none"
      style={{
        paddingTop: 'max(env(safe-area-inset-top), 24px)',
        paddingBottom: 'max(env(safe-area-inset-bottom), 20px)',
      }}
    >
      {/* 물을 게 하나뿐이면 진행점이 알려줄 게 없다 — 점 하나만 덩그러니 두지 않는다.
          뒤로 가기는 두지 않는다 — 앞 질문은 이미 저장됐고, 건너뛸 길도 만들지 않는다 */}
      {questions.length > 1 && (
        <div className="flex justify-end pt-2">
          <StepDots step={question} stepOrder={questions} />
        </div>
      )}

      {question === 'level' ? (
        <LevelStep onNext={answerLevel} />
      ) : (
        <AccentStep onNext={answerAccent} />
      )}
    </main>
  );
};
