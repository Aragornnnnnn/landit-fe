// 대화 화면 스켈레톤 — 실제 대화 화면과 같은 자리·크기로 그려, 진짜 화면이 떠도 칸이 움직이지 않게 한다
'use client';

import { STAGE_BACKGROUND_CLASS, STAGE_CHIN_LINE } from './flow/stage-layout';

// 진짜 내용이 올 자리에만 빛이 흐른다
const PLACEHOLDER_CLASS = 'animate-skeleton-flow';

export const ConversationSkeleton = () => (
  <main className="relative isolate mx-auto flex h-dvh max-w-[430px] flex-col bg-background">
    {/* 무대 — 상대가 설 자리. 진짜 무대와 같은 턱 선 높이·배경이라 캐릭터만 나타나고 칸은 움직이지 않는다 */}
    <div
      className="relative w-full flex-none"
      style={{ height: STAGE_CHIN_LINE }}
    >
      <div
        aria-hidden
        className={`absolute inset-x-0 top-0 -z-10 h-dvh ${STAGE_BACKGROUND_CLASS}`}
      />
    </div>

    <div className="flex min-h-0 flex-1 flex-col px-5">
      {/* 상대 말 칸 */}
      <section className="min-h-0 flex-auto pt-2">
        <div className="w-full rounded-[28px] rounded-tl-md bg-card px-5 py-5 shadow-lg shadow-black/5">
          <div className={`h-5 w-3/4 rounded-md ${PLACEHOLDER_CLASS}`} />
          <div className={`mt-3 h-5 w-1/2 rounded-md ${PLACEHOLDER_CLASS}`} />
        </div>
      </section>
    </div>

    {/* 마이크 자리 — 아직 누를 수 없으니 드러나지 않게 둔다 */}
    <footer className="flex-none pb-[max(var(--safe-area-inset-bottom),16px)]">
      <div className="flex h-24 flex-none flex-col items-center justify-center">
        <div className="size-20 rounded-full bg-muted/60" />
      </div>
    </footer>
  </main>
);
