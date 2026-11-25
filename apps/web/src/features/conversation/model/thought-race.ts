// 속마음 기다리기 — 상한 안에 오면 속마음과 대사를 함께 시작하고, 넘으면 뼈대로 먼저 시작했다가 도착하면 채운다
import { toThoughtType } from './pacing';
import type { BubbleThought } from './thought';
import type { ResolvedThought } from './useInnerThought';

// 조회 결과를 말풍선 줄로 — 비었으면(생성 실패·시간 초과) 줄을 두지 않는다
const toBubbleThought = (resolved: ResolvedThought): BubbleThought | null =>
  resolved.text
    ? {
        status: 'shown',
        text: resolved.text,
        type: toThoughtType(resolved.type),
        emotion: resolved.emotion,
      }
    : null;

export const raceThought = ({
  thought,
  waitMs,
  onStart,
  onArrive,
  isCancelled,
}: {
  // 속마음 조회 — null이면 대화를 떠나 조회를 멈춘 것이다
  thought: Promise<ResolvedThought | null>;
  waitMs: number;
  // 대사를 시작하는 순간 — 그때 들고 있는 속마음 줄과 함께. 한 번만 불린다
  onStart: (initial: BubbleThought | null) => void;
  // 뼈대로 시작한 뒤 속마음이 도착한 순간 — 비어 왔으면 null로 줄을 뺀다
  onArrive: (arrived: BubbleThought | null) => void;
  // 대화를 떠났는가 — 떠났으면 상한이 지나도 시작하지 않는다
  isCancelled: () => boolean;
}) => {
  let started = false;
  const timer = setTimeout(() => {
    if (isCancelled()) return;
    started = true;
    onStart({ status: 'pending' });
  }, waitMs);

  void thought.then((resolved) => {
    if (!resolved) {
      clearTimeout(timer);
      return;
    }
    const line = toBubbleThought(resolved);
    if (started) {
      onArrive(line);
      return;
    }
    clearTimeout(timer);
    started = true;
    onStart(line);
  });
};
