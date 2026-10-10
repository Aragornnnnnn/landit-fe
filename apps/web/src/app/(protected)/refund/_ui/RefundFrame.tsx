'use client';

// 환급 화면의 틀 — 헤더, 스크롤 영역, 아래에 붙는 버튼 자리. 실제 화면과 어드민 환급 점검이 같이 쓴다
import { useScrollShadow } from '@/shared/lib/useScrollShadow';
import { BackHeader } from '@/shared/ui/BackHeader';

export const RefundFrame = ({
  onBack,
  footer,
  fadeAboveFooter = false,
  children,
}: {
  onBack: () => void;
  // 아래 버튼 — 없으면 자리도 두지 않는다
  footer?: React.ReactNode;
  // 버튼 위를 구분선 대신 서서히 덮는다 — 한 번 읽고 지나가는 소개 화면처럼, 아래에 더 있다는 걸 알려야 할 때
  fadeAboveFooter?: boolean;
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
        <footer
          className={`relative flex-none px-5 pb-[max(var(--safe-area-inset-bottom),16px)] ${fadeAboveFooter ? 'pt-1' : 'border-t border-border pt-3'}`}
        >
          {fadeAboveFooter && (
            <div
              aria-hidden
              className="pointer-events-none absolute inset-x-0 bottom-full h-10 bg-linear-to-t from-background to-transparent"
            />
          )}
          {footer}
        </footer>
      )}
    </main>
  );
};
