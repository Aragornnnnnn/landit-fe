// 교정(더 자연스러운 말)이 붙은 말풍선 사이를 옮겨 다니는 커서 — 들어오면 첫 교정으로, 칩을 누르면 다음 교정으로
'use client';

import { useEffect, useState } from 'react';

import type { SmallTalkHistoryMessage } from '@/features/small-talk/api/small-talk';

// 말풍선의 DOM 앵커 id — 스크롤 목적지를 이걸로 찾는다
export const messageAnchorId = (messageId: number) => `message-${messageId}`;

const scrollToMessage = (messageId: number) =>
  document
    .getElementById(messageAnchorId(messageId))
    ?.scrollIntoView({ behavior: 'smooth', block: 'center' });

export const useCorrectionJump = (messages: SmallTalkHistoryMessage[]) => {
  const correctedIds = messages
    .filter((message) => message.correction)
    .map((message) => message.messageId);
  const firstId = correctedIds[0];

  // 지금 서 있는 교정. 응답이 와서 교정이 처음 보이면 첫 교정에 선다 — 그 한 번뿐이라
  // 폴링으로 응답이 갱신되거나 더 앞 메시지에 교정이 뒤늦게 생겨도 자리를 옮기지 않는다
  const [cursorId, setCursorId] = useState<number | null>(null);
  if (cursorId === null && firstId !== undefined) setCursorId(firstId);

  // 커서가 옮겨질 때마다 그 말풍선으로 — 도착도 점프도 같은 길로 간다
  useEffect(() => {
    if (cursorId !== null) scrollToMessage(cursorId);
  }, [cursorId]);

  // 서 있던 교정이 목록에서 사라졌으면(재조회로 내용이 바뀐 경우) 다음 자리를 셀 기준이 없다 —
  // indexOf가 -1이라 첫 교정으로 되돌아가 버리므로 그때는 칩을 접는다
  const cursorAt = cursorId === null ? -1 : correctedIds.indexOf(cursorId);
  const nextId = cursorAt < 0 ? undefined : correctedIds[cursorAt + 1];

  return {
    // 아직 안 간 교정이 남았는가 — 칩은 이때만 선다
    hasNext: nextId !== undefined,
    jumpNext: () => {
      if (nextId !== undefined) setCursorId(nextId);
    },
  };
};
