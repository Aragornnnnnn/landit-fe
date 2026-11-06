// 페이월을 떠난 순간을 남긴다 — 어느 단계에서, 닫기로인지 다른 길로인지, 얼마나 머물고 얼마나 내려 봤는지. 결제·복원으로 넘어가면 남기지 않는다
'use client';

import { useEffect, useEffectEvent, useRef } from 'react';
import {
  EVENTS,
  type PaywallSource,
  type PaywallStepName,
  type PaywallVariant,
} from '@landit/analytics';

import { track } from '@/shared/analytics';

/**
 * @param startStep 처음 보여 준 단계 — 단계형 페이월(환급·일본어)은 혜택이나 결제 금액 안내, 한 장 페이월은 single
 */
export const usePaywallExit = ({
  variant,
  source,
  startStep,
}: {
  variant: PaywallVariant;
  source?: PaywallSource;
  startStep: PaywallStepName;
}) => {
  const step = useRef(startStep);
  // 지금 단계에서 가장 깊이 내려 본 비율(0~1)
  const deepest = useRef(0);
  const closed = useRef(false);
  const unlocked = useRef(false);
  // 떠나는 순간의 값으로 남긴다 — 그사이 바뀐 진입 정보도 마지막 값을 쓴다
  const report = useEffectEvent((openedAt: number) => {
    if (unlocked.current) return;
    track(EVENTS.PAYWALL_EXITED, {
      step: step.current,
      trigger: closed.current ? 'close' : 'navigate',
      variant,
      ...(source && { paywall_source: source }),
      dwell_ms: Date.now() - openedAt,
      max_scroll_pct: Math.round(deepest.current * 100),
    });
  });

  useEffect(() => {
    const openedAt = Date.now();
    // 붙자마자 떼였다 다시 붙는 경우(개발 모드의 이중 마운트)는 떠남이 아니다
    let settled = false;
    const timer = setTimeout(() => {
      settled = true;
    }, 0);
    return () => {
      clearTimeout(timer);
      if (settled) report(openedAt);
    };
  }, []);

  return {
    // 단계를 옮겼다 — 스크롤 깊이는 새 단계에서 다시 잰다
    noteStep: (next: PaywallStepName) => {
      step.current = next;
      deepest.current = 0;
    },
    noteScroll: (root: HTMLElement) => {
      const room = root.scrollHeight - root.clientHeight;
      if (room <= 0) return;
      deepest.current = Math.max(
        deepest.current,
        Math.min(1, root.scrollTop / room),
      );
    },
    // 닫기 버튼으로 떠난다 — 곧 화면이 사라지며 남는다
    markClose: () => {
      closed.current = true;
    },
    // 결제·복원으로 유료가 됐다 — 이탈이 아니다
    markUnlocked: () => {
      unlocked.current = true;
    },
  };
};
