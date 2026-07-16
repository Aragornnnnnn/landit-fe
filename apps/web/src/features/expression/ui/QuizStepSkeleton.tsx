'use client';

// 표현학습 퀴즈 로딩 스켈레톤 — learning 데이터를 받는 동안 스피너 대신 실제 퀴즈 레이아웃 자리를 잡는다

// StepScaffold + QuizPrompt + 답변/단어뱅크/CTA 자리를 회색 블록으로 재현한다
export const QuizStepSkeleton = () => (
  <div
    className="mx-auto flex h-dvh max-w-[430px] flex-col bg-background"
    style={{ paddingTop: 'env(safe-area-inset-top)' }}
  >
    {/* 진행바 자리 */}
    <div className="h-1 w-full bg-secondary" />

    {/* 헤더 — 좌상단 닫기 버튼 자리 */}
    <header className="flex h-14 flex-none items-center px-3">
      <div className="size-6 animate-pulse rounded bg-muted" />
    </header>

    <div className="min-h-0 flex-1 overflow-y-auto px-5">
      {/* 지시문 자리 */}
      <div className="mt-2 h-6 w-2/3 animate-pulse rounded bg-muted" />

      {/* 캐릭터 + 질문 말풍선 */}
      <div className="mt-5 flex items-start gap-2">
        <div className="h-32 w-24 shrink-0 animate-pulse rounded-2xl bg-muted/60" />
        <div className="mt-3 flex-1 rounded-2xl rounded-tl-sm bg-secondary px-4 py-3">
          <div className="h-4 w-5/6 animate-pulse rounded bg-muted" />
          <div className="mt-2 h-3.5 w-2/3 animate-pulse rounded bg-muted" />
        </div>
      </div>

      {/* 내 채팅(한글) 말풍선 자리 — 오른쪽 정렬 */}
      <div className="mt-4 flex justify-end">
        <div className="h-11 w-[70%] animate-pulse rounded-2xl rounded-br-sm bg-secondary" />
      </div>

      {/* 답변 영역 자리 */}
      <div className="mt-6 min-h-[124px] animate-pulse rounded-2xl bg-muted/40" />

      {/* 단어 뱅크 자리 — 가운데 정렬 칩들 */}
      <div className="flex flex-wrap justify-center gap-2 pt-6 pb-4">
        {[44, 60, 52, 48, 64, 40].map((width, index) => (
          <div
            key={index}
            className="h-11 animate-pulse rounded-xl bg-secondary"
            style={{ width }}
          />
        ))}
      </div>
    </div>

    {/* 하단 CTA 자리 */}
    <div className="flex-none px-5 pt-3 pb-[max(env(safe-area-inset-bottom),24px)]">
      <div className="h-14 w-full animate-pulse rounded-2xl bg-muted" />
    </div>
  </div>
);
