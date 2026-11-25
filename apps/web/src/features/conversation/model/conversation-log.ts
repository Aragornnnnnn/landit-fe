// 대화 기록 — 끝난 턴의 상대 말(또는 내가 먼저 건 대화의 상황 안내)과 내 말을 순서대로 쌓아 둔다. 대화 칸이 이걸 말풍선으로 그린다

export interface LogEntry {
  // 기록 안에서 겹치지 않는 번호 — 말풍선 key로 쓴다
  id: number;
  // SITUATION은 내가 먼저 거는 대화의 첫 상황 안내 — 말풍선이 아니라 가운데 상황 카드로 남는다
  speaker: 'PARTNER' | 'SITUATION' | 'ME';
  text: string;
}

/** 한 턴이 끝났을 때 그 턴을 연 말(상대 말·상황 안내)과 내 말을 붙인다. 연 말이 없으면 내 말만 */
export const recordExchange = (
  log: readonly LogEntry[],
  opener:
    | (Omit<LogEntry, 'id' | 'speaker'> & {
        speaker: 'PARTNER' | 'SITUATION';
      })
    | null,
  mine: string,
): LogEntry[] => {
  const added: Omit<LogEntry, 'id'>[] = [
    ...(opener == null ? [] : [opener]),
    { speaker: 'ME', text: mine },
  ];
  return [
    ...log,
    ...added.map((entry, i) => ({ ...entry, id: log.length + i })),
  ];
};
