'use client';

// 내역 위의 작은 글자 한 줄 — 매일 보는 화면이라 규칙은 접어 두고, 누르면 그 자리에서 아래로 펼쳐진다
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
      <button
        type="button"
        aria-expanded={open}
        aria-controls={open ? panelId : undefined}
        onClick={() => setOpen(!open)}
        className="mx-auto flex items-center gap-0.5 py-1.5 text-[13px] font-medium text-muted-foreground"
      >
        환급 규칙
        <ChevronDownIcon
          size={14}
          className={`transition-transform ${open ? 'rotate-180' : ''}`}
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
            {/* 펼쳐져도 상자를 두르지 않는다 — 작은 글자를 눌렀는데 카드가 생기면 다른 것이 끼어든 것처럼 보인다 */}
            <div className="px-1 pt-2 pb-1">
              <RefundRuleList />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
