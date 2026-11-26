// 대화 화면 스켈레톤 — 상대를 아직 모를 때 띄운다. 진짜 대화 화면과 같은 무대·배치라 진짜 화면이 떠도 칸이 움직이지 않는다
'use client';

import { MicControl } from './flow/MicControl';
import { CHAT_TOP_LINE, STAGE_BACKGROUND_CLASS } from './flow/stage-layout';
import { ThinkingBubble } from './flow/ThinkingBubble';

// 기다리는 동안엔 누를 것이 없다 — 마이크는 자리와 모양만 보여 준다(대기 화면과 같다)
const ignorePress = () => {};

export const ConversationSkeleton = () => (
  <main className="relative isolate mx-auto flex h-dvh max-w-[430px] flex-col bg-background">
    {/* 무대 — 상대가 설 자리. 진짜 무대와 같은 높이·배경이라 캐릭터만 나타나고 칸은 움직이지 않는다 */}
    <div
      className="relative w-full flex-none"
      style={{ height: CHAT_TOP_LINE }}
    >
      <div
        aria-hidden
        className={`absolute inset-x-0 top-0 -z-10 h-dvh ${STAGE_BACKGROUND_CLASS}`}
      />
    </div>

    {/* 대화 칸 — 첫 말풍선이 올 자리(마이크 바로 위)에 점 세 개를 띄워 곧 대화가 시작된다는 걸 알린다 */}
    <div className="relative z-10 flex min-h-0 flex-1 flex-col justify-end px-4 pb-3">
      <ThinkingBubble />
    </div>

    <footer className="flex-none pb-[max(var(--safe-area-inset-bottom),16px)]">
      <MicControl
        phase="AI_THINKING"
        onPress={ignorePress}
        onCancel={ignorePress}
        onDone={ignorePress}
      />
    </footer>
  </main>
);
