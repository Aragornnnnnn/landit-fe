'use client';

// 환급 화면 헤더 오른쪽의 안내(i) 버튼 — 누르면 환급 규칙이 시트로 올라온다
import { useState } from 'react';
import { EVENTS } from '@landit/analytics';

import { RewardRuleList } from '@/features/reward/ui/RewardGuide';
import { track } from '@/shared/analytics';
import { BottomSheet } from '@/shared/ui/BottomSheet';
import { Button } from '@/shared/ui/Button';
import { InfoIcon } from '@/shared/ui/Icons';

export const RewardRulesButton = ({
  dailyWon,
}: {
  // 하루 몫. 도는 회차가 없으면 null
  dailyWon: number | null;
}) => {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        aria-label="환급 규칙"
        onClick={() => {
          track(EVENTS.REWARD_RULES_OPENED);
          setOpen(true);
        }}
        className="flex size-9 items-center justify-center rounded-full text-muted-foreground transition-all active:scale-90 active:bg-secondary"
      >
        <InfoIcon size={22} />
      </button>
      <BottomSheet open={open} onClose={() => setOpen(false)}>
        <div>
          <h2 className="text-[18px] font-black text-foreground">환급 규칙</h2>
          <div className="mt-4 mb-6">
            <RewardRuleList dailyWon={dailyWon} />
          </div>
          <Button onClick={() => setOpen(false)}>확인</Button>
        </div>
      </BottomSheet>
    </>
  );
};
