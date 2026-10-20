'use client';

// 환급 화면의 틀 — 헤더, 스크롤 영역, 아래에 붙는 버튼 자리. 실제 화면과 어드민 환급 점검이 같이 쓴다
import { useScrollShadow } from '@/shared/lib/useScrollShadow';
import { BackHeader } from '@/shared/ui/BackHeader';

import type { RewardGlow } from '../_model/pot-stage';

// 화면 맨 위(헤더 뒤)부터 내려오며 옅어지는 빛
const GLOW: Record<RewardGlow, string> = {
  gold: 'bg-[linear-gradient(to_bottom,rgb(255_200_80/0.25),transparent_430px)]',
  calm: 'bg-[linear-gradient(to_bottom,color-mix(in_oklab,var(--primary)_8%,transparent),transparent_430px)]',
  missed:
    'bg-[linear-gradient(to_bottom,color-mix(in_oklab,var(--destructive)_12%,transparent),transparent_430px)]',
};

export const RewardFrame = ({
  onBack,
  trailing,
  footer,
  fadeAboveFooter = false,
  glow = null,
  children,
}: {
  onBack: () => void;
  // 헤더 오른쪽 동작 — 참여자 화면의 규칙 안내 버튼
  trailing?: React.ReactNode;
  // 아래 버튼 — 없으면 자리도 두지 않는다
  footer?: React.ReactNode;
  // 버튼 위를 구분선 대신 서서히 덮는다 — 한 번 읽고 지나가는 소개 화면처럼, 아래에 더 있다는 걸 알려야 할 때
  fadeAboveFooter?: boolean;
  // 화면 위쪽의 빛 — 헤더 뒤까지 이어진다. 없으면 흰 바탕
  glow?: RewardGlow | null;
  children: React.ReactNode;
}) => {
  const { ref: scrollRef, onScroll, hasShadow } = useScrollShadow();

  return (
    <main
      className={`mx-auto flex h-dvh max-w-[430px] flex-col bg-background ${glow ? GLOW[glow] : ''}`}
    >
      <BackHeader
        title="환급"
        hasShadow={hasShadow}
        onBack={onBack}
        trailing={trailing}
        transparent={glow !== null}
      />
      <div
        ref={scrollRef}
        onScroll={onScroll}
        // 푸터가 없을 때는 내용이 바닥에 닿는다 — 내비게이션 바 위로 띄운다.
        // 입금 알림이 화면 밖까지 튀어나와도 손으로 좌우로 끌리지 않게 가로 스크롤은 막는다
        className={`flex-1 overflow-x-hidden overflow-y-auto ${footer ? '' : 'pb-[var(--safe-area-inset-bottom)]'}`}
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
