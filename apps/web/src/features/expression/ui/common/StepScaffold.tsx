'use client';

// 표현학습 스텝 공통 뼈대 — 상단 진행바 + 좌상단(뒤로가기/나가기X) 헤더 + 스크롤 본문 + 하단 CTA
import { useState } from 'react';

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
  // 진행바 색 — 기본 primary, 학습을 마친 성공 연출 중엔 success(초록)로
  progressTone?: 'primary' | 'success';
  // 헤더를 본문 위에 띄운다 — 히어로 이미지가 진행바 바로 아래부터 차는 화면용 (버튼에 반투명 원 배경)
  headerOverlay?: boolean;
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
  progressTone = 'primary',
  headerOverlay = false,
}: StepScaffoldProps) => {
  // 본문이 스크롤되면 헤더에 그림자를 드리워 콘텐츠가 아래로 지나감을 알린다 (오버레이 헤더 제외)
  const [scrolled, setScrolled] = useState(false);

  return (
    <div
      className="mx-auto flex h-dvh max-w-[430px] flex-col bg-background"
      style={{
        paddingTop: 'env(safe-area-inset-top)',
        ...(bottomInset ? { paddingBottom: bottomInset } : {}),
      }}
    >
      <div className="h-1 w-full bg-secondary">
        <div
          className={`h-full transition-[width,background-color] duration-300 ${
            progressTone === 'success' ? 'bg-success' : 'bg-primary'
          }`}
          style={{ width: `${progress * 100}%` }}
        />
      </div>

      <div className={headerOverlay ? 'relative min-h-0 flex-1' : 'contents'}>
        <header
          className={
            headerOverlay
              ? 'absolute inset-x-0 top-0 z-10 flex h-14 items-center px-3'
              : `relative z-10 flex h-14 flex-none items-center justify-center bg-background px-3 transition-shadow duration-200 ${
                  scrolled ? 'shadow-[0_8px_16px_-10px_rgba(0,0,0,0.25)]' : ''
                }`
          }
        >
          <button
            onClick={onBack}
            className={`flex size-10 items-center justify-center text-foreground ${
              headerOverlay
                ? // 배경 원 없이 아이콘만 — 어두운 이미지에서도 읽히게 흰 글로우만 살짝 깐다
                  '[filter:drop-shadow(0_0_4px_rgba(255,255,255,0.9))]'
                : 'absolute left-2'
            }`}
            aria-label={leftAction === 'close' ? '나가기' : '뒤로'}
          >
            {leftAction === 'close' ? (
              <CloseIcon size={24} />
            ) : (
              <ChevronLeftIcon size={24} />
            )}
          </button>
          {!headerOverlay && title && (
            <h1 className="text-base font-bold text-foreground">{title}</h1>
          )}
        </header>

        <div
          className={
            headerOverlay
              ? 'h-full overflow-y-auto px-5'
              : 'min-h-0 flex-1 overflow-y-auto px-5'
          }
          onScroll={(event) => setScrolled(event.currentTarget.scrollTop > 0)}
        >
          {children}
        </div>
      </div>

      {footer && (
        <div
          className={
            footerBleed
              ? 'flex-none'
              : 'flex-none px-5 pt-3 pb-[max(env(safe-area-inset-bottom),16px)]'
          }
        >
          {footer}
        </div>
      )}
    </div>
  );
};
