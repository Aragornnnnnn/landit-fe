'use client';

// 내역 위의 환급 규칙 카드 — 매일 보는 화면이라 접어 두고 제목 줄만 보인다. 누르면 같은 카드가 아래로 늘어난다
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
    // 상자는 늘 있고 펼치면 그 안이 늘어난다 — 누를 때 상자가 생겼다 사라지면 다른 것이 끼어든 것처럼 보인다
    <div className="mx-5 mt-3 rounded-[20px] border border-border bg-card">
      {/* 제목 줄 전체가 눌린다 — 처음 온 사람이 규칙을 찾아 누르기 쉬워야 한다 */}
      <button
        type="button"
        aria-expanded={open}
        aria-controls={open ? panelId : undefined}
        onClick={() => setOpen(!open)}
        // 접혀 있을 때는 내역보다 눈에 덜 띄게 옅게, 펼치면 소개 화면의 라벨처럼 진하게
        className={`flex w-full items-center justify-between px-4 py-3.5 text-[15px] transition-colors ${open ? 'font-black text-foreground' : 'font-bold text-muted-foreground'}`}
      >
        환급 규칙
        <ChevronDownIcon
          size={16}
          className={`text-muted-foreground transition-transform ${open ? 'rotate-180' : ''}`}
        />
      </button>
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
            <div className="px-4 pb-4">
              <RefundRuleList />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
