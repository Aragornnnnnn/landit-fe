// 답변 가이드 펼침 상태 — 칩·접기로 직접 여닫고, 대기 중 오래 망설이면 저절로 펼친다. 새 질문은 접힌 채 시작한다
'use client';

import { useEffect, useEffectEvent, useState } from 'react';

// 질문을 다 듣고 이만큼 말을 안 꺼내면 막힌 것으로 본다
export const answerGuideAutoOpenMs = 5000;

export type AnswerGuideTrigger = 'tap' | 'auto';

interface AnswerGuideToggleOptions {
  // 지금 화면의 질문 — 바뀌면 접힌 채 다시 시작한다
  question: string;
  // 이 질문에 가이드가 있는가
  available: boolean;
  // 말하기 전 대기 중인가 — 저절로 펼치는 건 이때만이다
  waiting: boolean;
  // 펼치거나 접은 순간 — 계측은 세션·턴을 아는 화면이 맡는다
  onToggled?: (opened: boolean, trigger: AnswerGuideTrigger) => void;
}

export const useAnswerGuideToggle = ({
  question,
  available,
  waiting,
  onToggled,
}: AnswerGuideToggleOptions) => {
  // 질문과 함께 저장한다 — 질문이 바뀐 첫 프레임에 이전 질문의 펼침이 새지 않게.
  // touched는 직접 누른 적이 있는지다. 직접 접은 질문은 다시 저절로 펼치지 않는다
  const [state, setState] = useState<{
    question: string;
    open: boolean;
    touched: boolean;
  } | null>(null);
  const current = state?.question === question ? state : null;
  const open = available && (current?.open ?? false);
  const touched = current?.touched ?? false;

  const toggle = (next: boolean, trigger: AnswerGuideTrigger) => {
    setState({ question, open: next, touched: trigger === 'tap' });
    onToggled?.(next, trigger);
  };

  const openAutomatically = useEffectEvent(() => toggle(true, 'auto'));
  // 저절로 펼칠 시계가 도는 중인가 — 화면이 열리기 직전에 칩을 반짝여 미리 알린다
  const autoPending = available && waiting && !open && !touched;

  useEffect(() => {
    if (!autoPending) return;
    const timer = setTimeout(openAutomatically, answerGuideAutoOpenMs);
    return () => clearTimeout(timer);
  }, [autoPending, question]);

  return {
    open,
    autoPending,
    openGuide: () => toggle(true, 'tap'),
    closeGuide: () => toggle(false, 'tap'),
    // 키보드로 바꿀 때 — 답변 칸이 입력창이 되니 비켜 준다. 가이드를 접은 게 아니라 계측하지 않고,
    // 입력을 취소해도 저절로 다시 덮지 않게 직접 만진 것으로 남긴다
    collapseGuide: () => setState({ question, open: false, touched: true }),
  };
};
