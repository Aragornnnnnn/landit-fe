// 헤더에서 여는 의견 보내기 버튼 — 아이콘+라벨, 누르면 만족도 서베이 바텀시트
'use client';

import { useState } from 'react';

import { BottomSheet } from '@/shared/ui/BottomSheet';
import { MessageCircleIcon } from '@/shared/ui/Icons';

import { FeedbackSurvey } from './FeedbackSurvey';

export function FeedbackButton() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="의견 보내기"
        className="flex h-11 flex-col items-center justify-center gap-0.5 rounded-xl px-3 text-muted-foreground transition-all active:scale-90 active:bg-secondary"
      >
        <MessageCircleIcon size={18} />
        <span className="text-[10px] font-medium whitespace-nowrap">
          의견 보내기
        </span>
      </button>

      <BottomSheet open={open} onClose={() => setOpen(false)}>
        <FeedbackSurvey onDone={() => setOpen(false)} />
      </BottomSheet>
    </>
  );
}
