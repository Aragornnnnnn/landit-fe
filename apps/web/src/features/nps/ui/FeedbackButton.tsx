// 헤더에서 여는 의견 보내기 버튼 — 아이콘+라벨, 누르면 만족도 서베이 바텀시트
'use client';

import { useState } from 'react';
import { EVENTS } from '@landit/analytics';

import { track } from '@/shared/analytics';
import { BottomSheet } from '@/shared/ui/BottomSheet';
import { HeaderAction } from '@/shared/ui/HeaderAction';
import { MessageCircleIcon } from '@/shared/ui/Icons';

import { FeedbackSurvey } from './FeedbackSurvey';

export function FeedbackButton() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <HeaderAction
        label="의견 보내기"
        onClick={() => {
          track(EVENTS.NPS_SURVEY_OPENED, { source: 'home_header' });
          setOpen(true);
        }}
      >
        <MessageCircleIcon size={18} />
      </HeaderAction>

      <BottomSheet open={open} onClose={() => setOpen(false)}>
        <FeedbackSurvey onDone={() => setOpen(false)} />
      </BottomSheet>
    </>
  );
}
