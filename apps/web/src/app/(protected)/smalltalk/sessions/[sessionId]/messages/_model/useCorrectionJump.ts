// 교정(더 자연스러운 말)이 붙은 말풍선 사이를 옮겨 다니는 커서 — 들어올 때 이미 있던 첫 교정으로,
// 그 뒤로는 칩을 누를 때마다 다음 교정으로
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

  // 대화가 처음 그려질 때 교정이 이미 있었는가. 종료 흐름에서는 교정이 폴링으로 뒤늦게 오는데,
  // 그때 화면을 끌면 위에서부터 읽고 있던 자리를 뺏는다 — 늦게 온 교정은 칩으로만 알리고
  // 언제 갈지는 사용자가 정한다
  const [greetedWithCorrections, setGreetedWithCorrections] = useState<
    boolean | null
  >(null);
  if (greetedWithCorrections === null && messages.length > 0) {
    setGreetedWithCorrections(firstId !== undefined);
  }

  // 지금 서 있는 교정. 아직 아무 데도 안 갔으면 null이고, 그때 칩은 첫 교정을 가리킨다
  const [visitedId, setVisitedId] = useState<number | null>(null);
  if (greetedWithCorrections && visitedId === null && firstId !== undefined) {
    setVisitedId(firstId);
  }

  // 커서가 옮겨질 때마다 그 말풍선으로 — 도착도 점프도 같은 길로 간다
  useEffect(() => {
    if (visitedId !== null) scrollToMessage(visitedId);
  }, [visitedId]);

  const visitedAt = visitedId === null ? -1 : correctedIds.indexOf(visitedId);
  // 서 있던 교정이 목록에서 사라졌으면(재조회로 내용이 바뀐 경우) 다음을 셀 기준이 없다 — 칩을 접는다
  const nextId =
    visitedId !== null && visitedAt < 0
      ? undefined
      : correctedIds[visitedAt + 1];

  return {
    // 아직 안 간 교정이 남았는가 — 칩은 이때만 선다
    hasNext: nextId !== undefined,
    jumpNext: () => {
      if (nextId !== undefined) setVisitedId(nextId);
    },
  };
};
