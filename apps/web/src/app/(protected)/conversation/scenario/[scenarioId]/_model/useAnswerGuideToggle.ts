// 답변 가이드 펼침 상태 — 칩·접기로 여닫고 새 질문은 접힌 채 시작한다. 유도 힌트는 대화에서 한 번만 보인다
'use client';

import { useState } from 'react';

interface AnswerGuideToggleOptions {
  // 지금 화면의 질문 — 바뀌면 접힌 채 다시 시작한다
  question: string;
  // 이 질문에 가이드가 있는가
  available: boolean;
  // 유도 힌트를 띄울 수 있는 때인가 — 어느 질문·단계인지는 화면이 정한다
  hintable: boolean;
  // 펼치거나 접은 순간 — 힌트를 보고 열었는지도 함께 알린다. 계측은 세션·턴을 아는 화면이 맡는다
  onToggled?: (opened: boolean, fromHint: boolean) => void;
}

export const useAnswerGuideToggle = ({
  question,
  available,
  hintable,
  onToggled,
}: AnswerGuideToggleOptions) => {
  // 질문과 함께 저장한다 — 질문이 바뀐 첫 프레임에 이전 질문의 펼침이 새지 않게
  const [opened, setOpened] = useState<{
    question: string;
    open: boolean;
  } | null>(null);
  const open = available && opened?.question === question && opened.open;
  // 사용자가 무언가 한 번 하면(칩·말하기·키보드) 힌트는 이 대화에서 다시 뜨지 않는다
  const [hintDismissed, setHintDismissed] = useState(false);
  const hintVisible = available && hintable && !open && !hintDismissed;

  const toggle = (next: boolean) => {
    setOpened({ question, open: next });
    setHintDismissed(true);
    onToggled?.(next, next && hintVisible);
  };

  return {
    open,
    hintVisible,
    openGuide: () => toggle(true),
    closeGuide: () => toggle(false),
    // 키보드로 바꿀 때 — 답변 칸이 입력창이 되니 비켜 준다. 가이드를 접은 게 아니라 계측하지 않는다
    collapseGuide: () => {
      setOpened({ question, open: false });
      setHintDismissed(true);
    },
    dismissHint: () => setHintDismissed(true),
  };
};
