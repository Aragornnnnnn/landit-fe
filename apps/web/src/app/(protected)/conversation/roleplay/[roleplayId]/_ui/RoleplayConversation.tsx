// 롤플레이 대화 화면 — 스몰톡과 같은 화면 골격(TalkScreen)에 롤플레이 흐름과 끝내기 시트를 꽂는다.
// 상대가 늘 먼저 말을 걸어 진입 안내가 없고, 속마음도 없다
'use client';

import { useState } from 'react';
import { EVENTS } from '@landit/analytics';
import { useRouter } from 'next/navigation';

import type { RoleplaySessionStartResponse } from '@/features/roleplay/api/roleplay';
import { toPartnerId } from '@/features/small-talk/model/partner';
import { TalkScreen } from '@/features/small-talk/ui/TalkScreen';
import { track } from '@/shared/analytics';
import { ROLEPLAY_PATH, roleplaySummaryPath } from '@/shared/lib/routes';

import { useRoleplayTalkFlow } from '../_model/useRoleplayTalkFlow';
import { RoleplayExitSheet } from './RoleplayExitSheet';

export const RoleplayConversation = ({
  session,
}: {
  session: RoleplaySessionStartResponse;
}) => {
  const router = useRouter();
  const partner = toPartnerId(session.character?.characterId ?? null);
  // 막 끝낸 대화라 요약 앞에 축하(열매)를 먼저 띄운다
  const summaryPath = roleplaySummaryPath(session.sessionId, {
    celebrate: true,
  });
  const showSummary = () => router.replace(summaryPath);
  const [showExitSheet, setShowExitSheet] = useState(false);
  const flow = useRoleplayTalkFlow({
    session,
    partner,
    goHome: () => router.replace(ROLEPLAY_PATH),
    showSummary,
  });

  return (
    <TalkScreen
      sessionId={session.sessionId}
      partner={partner}
      flow={flow}
      summaryPath={summaryPath}
      onShowSummary={showSummary}
      onExitRequested={() => setShowExitSheet(true)}
    >
      <RoleplayExitSheet
        open={showExitSheet}
        completing={flow.completing}
        onComplete={() => void flow.completeTalk()}
        onClose={() => {
          // 완료 요청 중에는 닫지 않는다 — 닫으면 끝내기로 한 대화가 이어지는 것처럼 보인다
          if (flow.completing) return;
          track(EVENTS.CONFIRM_SHEET_DISMISSED, { sheet: 'conversation_exit' });
          setShowExitSheet(false);
        }}
      />
    </TalkScreen>
  );
};
