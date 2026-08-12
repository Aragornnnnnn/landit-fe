// 스몰톡 대화 진입 — 세션이 열려야 첫 마디가 생기므로, 열릴 때까지 기다렸다가 본편을 띄운다.
// 시나리오는 홈 캐시의 오프닝으로 바로 그릴 수 있었지만 스몰톡은 상대의 첫 마디도 그때 만들어진다
'use client';

import { EVENTS } from '@landit/analytics';
import { useRouter } from 'next/navigation';

import type { Partner } from '@/features/conversation/model/character-look';
import { ConversationSkeleton } from '@/features/conversation/ui/ConversationSkeleton';
import { track } from '@/shared/analytics';
import { SMALLTALK_PATH } from '@/shared/lib/routes';
import { Button } from '@/shared/ui/Button';

import type { SmallTalkStartMode } from '@/features/small-talk/api/small-talk';
import { useSmallTalkMainQuery } from '@/features/small-talk/model/useSmallTalkMainQuery';
import { useSmallTalkSession } from '../_model/useSmallTalkSession';
import { SmallTalkConversation } from './SmallTalkConversation';

interface SmallTalkFlowProps {
  startMode: SmallTalkStartMode;
  topicId?: number;
  partner: Partner;
}

export const SmallTalkFlow = ({
  startMode,
  topicId,
  partner,
}: SmallTalkFlowProps) => {
  const router = useRouter();
  const { session, error, end } = useSmallTalkSession({
    startMode,
    topicId,
    partner,
  });
  // 오늘 남은 시간은 홈이 이미 받아 둔 값이다 — 주소로 바로 들어왔으면 여기서 받아온다.
  // 세션 시작 응답의 speakingTimeLimitMs는 하루 총량이라 잔량 대신 쓸 수 없다
  const { main } = useSmallTalkMainQuery();

  if (error) {
    return (
      <main className="mx-auto flex h-dvh max-w-[430px] flex-col items-center justify-center gap-4 bg-background px-6 text-center">
        <p className="break-keep text-muted-foreground">
          대화를 시작하지 못했어요. 잠시 후 다시 시도해 주세요
        </p>
        <Button
          variant="secondary"
          size="sm"
          className="w-auto px-6"
          onClick={() => {
            track(EVENTS.ERROR_RETRIED, { screen: 'smalltalk' });
            router.replace(SMALLTALK_PATH);
          }}
        >
          돌아가기
        </Button>
      </main>
    );
  }

  // 잔량을 아직 못 받았으면 대화도 열지 않는다 — 남은 시간을 모른 채 말하기부터 시작할 수는 없다
  if (!session || !main) return <ConversationSkeleton />;

  return (
    <SmallTalkConversation
      session={session}
      partner={partner}
      remainingSpeakingTimeMs={main.remainingSpeakingTimeMs}
      endSession={end}
    />
  );
};
