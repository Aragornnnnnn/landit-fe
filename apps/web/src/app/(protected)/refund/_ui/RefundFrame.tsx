'use client';

// 환급 화면의 틀 — 헤더, 스크롤 영역, 아래에 붙는 버튼 자리. 실제 화면과 어드민 환급 점검이 같이 쓴다
import { useScrollShadow } from '@/shared/lib/useScrollShadow';
import { BackHeader } from '@/shared/ui/BackHeader';

export const RefundFrame = ({
  onBack,
  footer,
  children,
}: {
  onBack: () => void;
  // 아래 버튼 — 없으면 자리도 두지 않는다
  footer?: React.ReactNode;
  children: React.ReactNode;
}) => {
  const { ref: scrollRef, onScroll, hasShadow } = useScrollShadow();

  return (
    <main className="mx-auto flex h-dvh max-w-[430px] flex-col bg-background">
      <BackHeader title="환급" hasShadow={hasShadow} onBack={onBack} />
      <div
        ref={scrollRef}
        onScroll={onScroll}
        className="flex-1 overflow-y-auto"
      >
        {children}
      </div>
      {footer && (
        <footer className="relative flex-none px-5 pt-1 pb-[max(var(--safe-area-inset-bottom),16px)]">
          {/* 구분선 대신 위쪽을 배경색으로 서서히 덮는다 — 선에서 딱 끊기면 아래에 내용이 더 있는지 알 수 없다 */}
          <div
            aria-hidden
            className="pointer-events-none absolute inset-x-0 bottom-full h-10 bg-linear-to-t from-background to-transparent"
          />
          {footer}
        </footer>
      )}
    </main>
  );
};
