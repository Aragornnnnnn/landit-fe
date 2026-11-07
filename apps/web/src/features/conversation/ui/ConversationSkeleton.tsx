// 대화 화면 스켈레톤 — 실제 대화 화면과 같은 자리·크기로 그려, 진짜 화면이 떠도 칸이 움직이지 않게 한다
'use client';

import type { Partner } from '../model/character-look';
import { CharacterStage } from './flow/CharacterStage';
import { MicControl } from './flow/MicControl';
import { ThinkingBubble } from './flow/ThinkingBubble';

// 진짜 내용이 올 자리에만 빛이 흐른다
const PLACEHOLDER_CLASS = 'animate-skeleton-flow';

// 대기 화면엔 누를 것이 없다 — 마이크는 자리와 모양만 보여 준다
const ignorePress = () => {};

interface ConversationSkeletonProps {
  // 상대를 이미 알면 무대에 세운다 — 기다리는 동안에도 누구와 얘기하러 왔는지 보이게
  partner?: Partner;
  // 상대가 먼저 말하는 대화면 말 칸에 점 세 개를 띄워 첫 말이 곧 온다는 걸 알린다
  partnerSpeaksFirst?: boolean;
}

export const ConversationSkeleton = ({
  partner,
  partnerSpeaksFirst = false,
}: ConversationSkeletonProps = {}) => (
  <main className="mx-auto flex h-dvh max-w-[430px] flex-col bg-background">
    {/* 무대 — 상대가 설 자리 */}
    {partner ? (
      <CharacterStage
        partner={partner}
        look={{ posture: 'idle', expression: 'neutral' }}
        speech={null}
      />
    ) : (
      <div
        className={`w-full flex-none rounded-b-3xl border-b border-border shadow-lg shadow-black/5 ${PLACEHOLDER_CLASS}`}
        style={{
          height:
            'calc(min(17rem, 34dvh) + max(var(--safe-area-inset-top), 8px))',
        }}
      />
    )}

    <div className="flex min-h-0 flex-1 flex-col px-5">
      {/* 상대 말 칸 */}
      <section className="min-h-0 flex-auto pt-2">
        {partner && partnerSpeaksFirst ? (
          <ThinkingBubble />
        ) : (
          <div className="w-full rounded-[28px] rounded-tl-md bg-card px-5 py-5 shadow-lg shadow-black/5">
            <div className={`h-5 w-3/4 rounded-md ${PLACEHOLDER_CLASS}`} />
            <div className={`mt-3 h-5 w-1/2 rounded-md ${PLACEHOLDER_CLASS}`} />
          </div>
        )}
      </section>
      {/* 내 답변 칸 — 아직 쓸 말이 없어 빈 칸으로 둔다 */}
      <div className="mt-3 h-28 w-full flex-none rounded-2xl border border-border/60 bg-muted/50" />
    </div>

    {/* 마이크 자리 — 상대를 알면 대화 중 잠긴 마이크 그대로, 모르면 드러나지 않게 둔다 */}
    <footer className="flex-none pb-[max(var(--safe-area-inset-bottom),16px)]">
      {partner ? (
        <MicControl
          phase="AI_THINKING"
          onPress={ignorePress}
          onCancel={ignorePress}
          onDone={ignorePress}
        />
      ) : (
        <div className="flex h-24 flex-none flex-col items-center justify-center">
          <div className="size-20 rounded-full bg-muted/60" />
        </div>
      )}
    </footer>
  </main>
);
