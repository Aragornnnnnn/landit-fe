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
        <footer className="flex-none border-t border-border px-5 pt-3 pb-[max(var(--safe-area-inset-bottom),16px)]">
          {footer}
        </footer>
      )}
    </main>
  );
};
