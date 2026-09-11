// 기존 유저 프로필 질문 게이트 — 온보딩은 이미 마쳤지만 아직 안 답한 질문(배울 영어)을 홈 탭 진입 시 무조건 묻는다.
// 신규 유저는 온보딩 스텝에서 이미 답하고 오므로 여기서 다시 뜨지 않는다.
// 화면은 온보딩 스텝을 그대로 다시 쓴다 — 같은 질문을 두 벌로 적어두면 문구가 갈라진다.
// 탭 셸에 심겨 있어 딥링크로 다른 화면에 직행하면 그때는 지나가고, 다음 홈 방문에 막는다
'use client';

import { useEffect, useRef } from 'react';
import { EVENTS, type AccentLocale } from '@landit/analytics';

import { track } from '@/shared/analytics';
import { hasSeenOnboarding } from '@/shared/auth/onboarding-seen';
import { useClientOnlyValue } from '@/shared/lib/useClientOnlyValue';
import { useFocusTrap } from '@/shared/lib/useFocusTrap';

import { shouldAskAccent } from '../model/profile-gate';
import { useAccentQuery } from '../model/useAccentQuery';
import { useSaveAccentMutation } from '../model/useSaveAccentMutation';
import { AccentStep } from './steps/AccentStep';

export const ProfileGate = () => {
  const accentQuery = useAccentQuery();
  const saveAccent = useSaveAccentMutation();

  // 온보딩을 아직 안 거친 유저는 온보딩 스텝에서 곧 물으니 여기서는 막지 않는다.
  // 서버엔 localStorage가 없어 하이드레이션이 끝난 뒤에야 읽는다
  const seenOnboarding = useClientOnlyValue(hasSeenOnboarding, false);
  // 조회를 못 받았으면 undefined로 두어 묻지 않는다. 답하면 캐시에 심기는 즉시 닫힌다
  const asking =
    seenOnboarding &&
    shouldAskAccent(
      accentQuery.isSuccess ? accentQuery.data.accentLocale : undefined,
    );

  // 화면을 덮기만 하면 키보드·스크린 리더는 뒤의 탭바와 콘텐츠에 그대로 닿는다 — 건너뛸 길이 생기는 셈이다
  const panelRef = useRef<HTMLElement>(null);
  useFocusTrap(asking, panelRef);

  useEffect(() => {
    if (asking) track(EVENTS.PROFILE_GATE_VIEWED, { question: 'accent' });
  }, [asking]);

  if (!asking) return null;

  const answerAccent = (accent: AccentLocale) => {
    saveAccent.mutate(accent);
    track(EVENTS.PROFILE_GATE_ANSWERED, { question: 'accent', accent });
  };

  // 뒤로 가기·건너뛰기는 두지 않는다 — 물을 게 하나뿐이고, 답해야 홈이 열린다
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
      <AccentStep onNext={answerAccent} />
    </main>
  );
};
