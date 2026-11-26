// 대화 기록 — 끝난 턴의 상대 말(또는 내가 먼저 건 대화의 상황 안내)과 내 말을 순서대로 쌓아 둔다. 대화 칸이 이걸 말풍선으로 그린다
import type { FloatingThought } from './thought';
import type { SpeechSource } from './useAiSpeech';

/** 지난 상대 말 — 지금 차례 말풍선처럼 다시 듣기·해석·속마음을 그대로 쓸 수 있게 그 턴의 재료를 함께 남긴다 */
export interface PartnerLogEntry {
  // 기록 안에서 겹치지 않는 번호 — 말풍선 key로 쓴다
  id: number;
  speaker: 'PARTNER';
  text: string;
  translation: string | null;
  // 이 말풍선 맨 위에 떴던 속마음 — 끝내 안 왔으면 null
  thought: FloatingThought | null;
  // 다시 들을 소리
  source: SpeechSource;
  // 이 말이 나온 턴 — 다시 듣기 계측에 싣는다
  turnIndex: number;
}

/** 내 말, 또는 내가 먼저 거는 대화의 첫 상황 안내(SITUATION — 말풍선이 아니라 가운데 상황 카드로 남는다) */
export interface PlainLogEntry {
  id: number;
  speaker: 'SITUATION' | 'ME';
  text: string;
}

export type LogEntry = PartnerLogEntry | PlainLogEntry;

type Opener =
  | Omit<PartnerLogEntry, 'id'>
  | (Omit<PlainLogEntry, 'id' | 'speaker'> & { speaker: 'SITUATION' });

/** 한 턴이 끝났을 때 그 턴을 연 말(상대 말·상황 안내)과 내 말을 붙인다. 연 말이 없으면 내 말만 */
export const recordExchange = (
  log: readonly LogEntry[],
  opener: Opener | null,
  mine: string,
): LogEntry[] => {
  const added: Omit<LogEntry, 'id'>[] = [
    ...(opener == null ? [] : [opener]),
    { speaker: 'ME', text: mine },
  ];
  return [
    ...log,
    ...added.map((entry, i) => ({ ...entry, id: log.length + i }) as LogEntry),
  ];
};
