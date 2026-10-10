'use client';

// 내역 위 오른쪽 끝의 작은 글자 한 줄 — 매일 보는 화면이라 규칙은 접어 두고, 누르면 그 자리에서 아래로 펼쳐진다
import { useId, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';

import { RefundRuleList } from '@/features/reward/ui/RefundGuide';
import { DURATION, EASE_STANDARD } from '@/shared/motion';
import { ChevronDownIcon } from '@/shared/ui/Icons';

export const RefundRulesToggle = () => {
  const [open, setOpen] = useState(false);
  const reduced = useReducedMotion();
  const panelId = useId();
  // 동작 줄이기를 켰으면 높이는 움직이지 않고 흐려지기만 한다
  const closed = reduced ? { opacity: 0 } : { height: 0, opacity: 0 };
  const opened = reduced ? { opacity: 1 } : { height: 'auto', opacity: 1 };

  return (
    <div className="mx-5 mt-3">
      {/* 규칙을 오른쪽 끝에 붙여 내역의 금액 열과 줄을 맞춘다 — 가운데에 떠 있으면 위 칸의 것인지 아래 내역의 것인지 알 수 없다 */}
      <div className="flex justify-end">
        <button
          type="button"
          aria-expanded={open}
          aria-controls={open ? panelId : undefined}
          onClick={() => setOpen(!open)}
          className="flex items-center gap-0.5 py-1.5 text-[13px] font-medium text-muted-foreground"
        >
          환급 규칙
          <ChevronDownIcon
            size={14}
            className={`transition-transform ${open ? 'rotate-180' : ''}`}
          />
        </button>
      </div>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            id={panelId}
            className="overflow-hidden"
            initial={closed}
            animate={opened}
            exit={closed}
            transition={{ duration: DURATION.base, ease: EASE_STANDARD }}
          >
            {/* 소개 화면의 규칙 카드와 같은 상자에 담는다 — 맨바닥에 펼치면 아래 내역 줄과 섞여 보인다 */}
            <div className="pt-1.5 pb-1">
              <div className="rounded-[20px] border border-border bg-card px-4 py-4">
                <RefundRuleList />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
