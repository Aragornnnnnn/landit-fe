// 말풍선마다 영어 글자를 가릴지 — 사용자가 그 말풍선에서 고른 대로 지난 대화가 돼도 유지하고, 고른 적 없으면 설정을 따른다
import { useState } from 'react';

export const useTextReveal = (hiddenBySetting: boolean) => {
  // 턴 번호 → 사용자가 고른 보임 여부
  const [chosen, setChosen] = useState<ReadonlyMap<number, boolean>>(
    () => new Map(),
  );

  const hiddenFor = (turnIndex: number) => {
    const visible = chosen.get(turnIndex);
    return visible === undefined ? hiddenBySetting : !visible;
  };

  const record = (turnIndex: number, visible: boolean) =>
    setChosen((prev) => new Map(prev).set(turnIndex, visible));

  return { hiddenFor, record };
};
