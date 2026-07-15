'use client';

// 표현학습 스텝 공통 뼈대 — 상단 진행바 + 좌상단(뒤로가기/나가기X) 헤더 + 스크롤 본문 + 하단 CTA
import { ChevronLeftIcon, CloseIcon } from '@/shared/ui/Icons';

interface StepScaffoldProps {
  title?: string; // 없으면 헤더에 제목 없이 좌상단 버튼만
  progress: number; // 0..1
  onBack: () => void;
  // back(‹)=이전 스텝, close(X)=플로우 나가기. 기본 back
  leftAction?: 'back' | 'close';
  children: React.ReactNode;
  footer?: React.ReactNode;
  footerBleed?: boolean; // 키보드처럼 하단을 좌우 끝까지 채울 때
  bottomInset?: number; // 네이티브 키보드가 가린 높이(px) — 하단 footer를 그만큼 위로 올린다
}

export const StepScaffold = ({
  title,
  progress,
  onBack,
  leftAction = 'back',
  children,
  footer,
  footerBleed,
  bottomInset = 0,
}: StepScaffoldProps) => (
  <div
    className="mx-auto flex h-dvh max-w-[430px] flex-col bg-background"
    style={bottomInset ? { paddingBottom: bottomInset } : undefined}
  >
    <div className="h-1 w-full bg-secondary">
      <div
        className="h-full bg-primary transition-[width] duration-300"
        style={{ width: `${progress * 100}%` }}
      />
    </div>

    <header className="relative flex h-14 flex-none items-center justify-center px-3">
      <button
        onClick={onBack}
        className="absolute left-2 flex size-10 items-center justify-center text-foreground"
        aria-label={leftAction === 'close' ? '나가기' : '뒤로'}
      >
        {leftAction === 'close' ? (
          <CloseIcon size={24} />
        ) : (
          <ChevronLeftIcon size={24} />
        )}
      </button>
      {title && (
        <h1 className="text-base font-bold text-foreground">{title}</h1>
      )}
    </header>

    <div className="min-h-0 flex-1 overflow-y-auto px-5">{children}</div>

    {footer && (
      <div className={footerBleed ? 'flex-none' : 'flex-none px-5 pt-3 pb-6'}>
        {footer}
      </div>
    )}
  </div>
);
