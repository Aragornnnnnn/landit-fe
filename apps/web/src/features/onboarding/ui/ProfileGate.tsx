// 프로필 질문 게이트 — 아직 안 답한 질문(배울 영어)을 홈 탭 진입 시 무조건 묻는다.
// 온보딩을 끝까지 본 유저는 스텝에서 이미 답하고 오므로 뜨지 않고, 중간에 나간 유저는 여기서 답한다.
// 화면은 온보딩 스텝을 그대로 다시 쓴다 — 같은 질문을 두 벌로 적어두면 문구가 갈라진다.
// 탭 셸에 심겨 있어 딥링크로 다른 화면에 직행하면 그때는 지나가고, 다음 홈 방문에 막는다
'use client';

import { useEffect, useRef } from 'react';
import { EVENTS, type AccentLocale } from '@landit/analytics';
import { useTranslations } from 'next-intl';

import { track } from '@/shared/analytics';
import { useFocusTrap } from '@/shared/lib/useFocusTrap';

import { useAskingAccent } from '../model/useAskingAccent';
import { useSaveAccentMutation } from '../model/useSaveAccentMutation';
import { AccentStep } from './steps/AccentStep';

export const ProfileGate = () => {
  const t = useTranslations('onboarding.profileGate');
  const saveAccent = useSaveAccentMutation();
  const asking = useAskingAccent();

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
      aria-label={t('dialogLabel')}
      tabIndex={-1}
      className="fixed inset-0 z-50 mx-auto flex h-dvh max-w-[430px] flex-col overflow-hidden bg-background px-6 text-foreground outline-none"
      style={{
        paddingTop: 'max(var(--safe-area-inset-top), 24px)',
        paddingBottom: 'max(var(--safe-area-inset-bottom), 20px)',
      }}
    >
      <AccentStep onNext={answerAccent} />
    </main>
  );
};
