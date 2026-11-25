// 상대 말풍선마다 사용자가 고른 것 — 영어 글자 보임과 해석 펼침을 턴별로 기억해, 지난 대화가 돼도 이어 간다
import { useState } from 'react';

export const useBubbleChoices = (hiddenBySetting: boolean) => {
  // 턴 번호 → 사용자가 고른 글자 보임
  const [textChosen, setTextChosen] = useState<ReadonlyMap<number, boolean>>(
    () => new Map(),
  );
  // 해석을 펼쳐 둔 턴 — 그 말풍선이 지난 대화가 되면 펼친 채 나타나 부드럽게 접힌다. 접히고 나면 지운다
  const [translationOpen, setTranslationOpen] = useState<ReadonlySet<number>>(
    () => new Set(),
  );

  // 고른 적 없으면 설정을 따른다
  const hiddenFor = (turnIndex: number) => {
    const visible = textChosen.get(turnIndex);
    return visible === undefined ? hiddenBySetting : !visible;
  };

  const recordText = (turnIndex: number, visible: boolean) =>
    setTextChosen((prev) => new Map(prev).set(turnIndex, visible));

  const translationWasOpen = (turnIndex: number) =>
    translationOpen.has(turnIndex);

  const recordTranslation = (turnIndex: number, opened: boolean) =>
    setTranslationOpen((prev) => {
      if (prev.has(turnIndex) === opened) return prev;
      const next = new Set(prev);
      if (opened) next.add(turnIndex);
      else next.delete(turnIndex);
      return next;
    });

  return {
    hiddenFor,
    recordText,
    translationWasOpen,
    recordTranslation,
  };
};
