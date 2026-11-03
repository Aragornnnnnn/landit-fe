// 스몰톡 대화 화면 — 세션이 열린 뒤의 본편. 화면 골격은 발화 시간을 쓰는 대화가 같이 쓰는 TalkScreen이고,
// 스몰톡에만 있는 것은 둘이다 — 내가 먼저 걸 때의 진입 안내, 그리고 작별 인사를 권하는 종료 시트
'use client';

import { useState } from 'react';
import { EVENTS } from '@landit/analytics';
import { useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';

import type { Partner } from '@/features/conversation/model/character-look';
import type { SmallTalkSessionStartResponse } from '@/features/small-talk/api/small-talk';
import { TalkScreen } from '@/features/small-talk/ui/TalkScreen';
import { track } from '@/shared/analytics';
import { SMALLTALK_PATH, smallTalkSummaryPath } from '@/shared/lib/routes';

import { GOODBYE_PHRASES, pickGoodbyePhrase } from '../_model/goodbye-phrase';
import { useSmallTalkFlow } from '../_model/useSmallTalkFlow';
import { SmallTalkExitSheet } from './SmallTalkExitSheet';

interface SmallTalkConversationProps {
  session: SmallTalkSessionStartResponse;
  partner: Partner;
  remainingSpeakingTimeMs: number;
  endSession: () => void;
}

export const SmallTalkConversation = ({
  session,
  partner,
  remainingSpeakingTimeMs,
  endSession,
}: SmallTalkConversationProps) => {
  const t = useTranslations('conversation.smallTalkConversation');
  const router = useRouter();
  const goHome = () => router.replace(SMALLTALK_PATH);
  const summaryPath = smallTalkSummaryPath(session.sessionId);
  const showSummary = () => router.replace(summaryPath);
  const [showExitSheet, setShowExitSheet] = useState(false);
  // 시트를 열 때마다 다른 작별 인사를 보여 준다 — 열려 있는 동안은 바뀌지 않게 여는 순간에 고른다
  const [goodbyePhrase, setGoodbyePhrase] = useState<string>(
    GOODBYE_PHRASES[0],
  );
  const flow = useSmallTalkFlow({
    session,
    partner,
    remainingSpeakingTimeMs,
    endSession,
    goHome,
    showSummary,
  });

  return (
    <TalkScreen
      sessionId={session.sessionId}
      partner={partner}
      flow={flow}
      summaryPath={summaryPath}
      onShowSummary={showSummary}
      onExitRequested={() => {
        setGoodbyePhrase(pickGoodbyePhrase());
        setShowExitSheet(true);
      }}
      userFirstHint={t('userFirstHint')}
    >
      <SmallTalkExitSheet
        open={showExitSheet}
        goodbyePhrase={goodbyePhrase}
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
