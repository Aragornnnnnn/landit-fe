// 대화 기록 — 끝난 턴의 상대 말과 내 말을 순서대로 쌓아 둔다. 대화 칸이 이걸 말풍선으로 그린다

export interface LogEntry {
  // 기록 안에서 겹치지 않는 번호 — 말풍선 key로 쓴다
  id: number;
  speaker: 'PARTNER' | 'ME';
  text: string;
}

/** 한 턴이 끝났을 때 그 턴의 상대 말과 내 말을 붙인다. 내가 먼저 건 첫 턴은 상대 말이 없다 */
export const recordExchange = (
  log: readonly LogEntry[],
  partner: string | null,
  mine: string,
): LogEntry[] => {
  const added: Omit<LogEntry, 'id'>[] = [
    ...(partner == null
      ? []
      : [{ speaker: 'PARTNER' as const, text: partner }]),
    { speaker: 'ME', text: mine },
  ];
  return [
    ...log,
    ...added.map((entry, i) => ({ ...entry, id: log.length + i })),
  ];
};
