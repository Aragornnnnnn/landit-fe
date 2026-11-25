// 문장별 교정을 말풍선에 그릴 묶음과 칠할 조각으로 나눈다 — 스몰톡·롤플레이 대화 기록이 같이 쓴다
import type {
  SentenceCorrection,
  TextRange,
  TranscriptSentence,
} from '../api/small-talk';

// 교정이 붙은 문장 — 묶음에서 따로 선 문장은 교정이 반드시 있다
export type CorrectedSentence = TranscriptSentence & {
  correction: SentenceCorrection;
};

export type SentenceBlock =
  | { kind: 'plain'; text: string }
  | { kind: 'corrected'; sentence: CorrectedSentence };

// 고칠 게 없는 문장이 이어지면 원문처럼 한 덩어리로 붙이고, 고친 문장은 하나씩 따로 세운다
export const groupSentences = (sentences: TranscriptSentence[]) =>
  sentences.reduce<SentenceBlock[]>((blocks, sentence) => {
    const { correction } = sentence;
    if (correction) {
      return [
        ...blocks,
        { kind: 'corrected', sentence: { ...sentence, correction } },
      ];
    }
    const last = blocks.at(-1);
    if (last?.kind === 'plain') {
      return [
        ...blocks.slice(0, -1),
        { kind: 'plain', text: `${last.text} ${sentence.text}` },
      ];
    }
    return [...blocks, { kind: 'plain', text: sentence.text }];
  }, []);

// 문장을 범위 안(칠할 곳)과 밖으로 순서대로 자른다 — 범위는 시작 순이고 겹치지 않는다는 계약이지만,
// 어긋나 와도 이미 그린 글자를 다시 그리지 않게 앞 범위 끝부터 자른다
export const splitByRanges = (text: string, ranges: TextRange[]) => {
  const parts: { text: string; marked: boolean }[] = [];
  let cursor = 0;
  for (const range of ranges) {
    const start = Math.max(range.start, cursor);
    const end = Math.min(range.end, text.length);
    if (start >= end) continue;
    if (start > cursor) {
      parts.push({ text: text.slice(cursor, start), marked: false });
    }
    parts.push({ text: text.slice(start, end), marked: true });
    cursor = end;
  }
  if (cursor < text.length) {
    parts.push({ text: text.slice(cursor), marked: false });
  }
  return parts;
};

// 이 말에 고친 문장이 하나라도 있는가 — 말풍선 모양과 다음 교정 칩이 이걸로 갈린다.
// BE 배포 전·롤백된 응답엔 sentences가 없다 — 그땐 고친 문장이 없는 것으로 보고 원문 말풍선을 그린다
export const hasSentenceCorrection = (
  sentences: TranscriptSentence[] | undefined,
) => (sentences ?? []).some((sentence) => sentence.correction);

// 고친 문장이 몇 개인가 — 말풍선 아래 「고친 문장 n개」가 쓴다. 서버는 이 수를 따로 주지 않는다
export const countCorrectedSentences = (
  sentences: TranscriptSentence[] | undefined,
) => (sentences ?? []).filter((sentence) => sentence.correction).length;
