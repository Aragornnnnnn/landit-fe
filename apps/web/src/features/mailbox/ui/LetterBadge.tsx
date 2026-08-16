// 편지 종류·처리 상태 칩 — 리스트와 상세가 같은 칩을 쓴다
import type { LetterBadgeTone } from '../model/letter-badge';

const TONE_CLASSES: Record<LetterBadgeTone, string> = {
  // 공지는 색을 안 준다 — 늘 맨 위에 있어서 색까지 주면 리스트가 시끄러워진다.
  // 대신 테두리를 둬야 흰 배경 위에서 칩으로 읽힌다
  notice: 'border border-border bg-card text-muted-foreground',
  update: 'bg-letter-update-bg text-letter-update',
  reply: 'bg-letter-reply-bg text-letter-reply',
  pending: 'bg-letter-pending-bg text-letter-pending',
  completed: 'bg-letter-answered-bg text-letter-answered',
};

interface LetterBadgeProps {
  label: string;
  tone: LetterBadgeTone;
}

export const LetterBadge = ({ label, tone }: LetterBadgeProps) => (
  <span
    className={`shrink-0 rounded-full px-2.5 py-1 text-[11px] font-semibold ${TONE_CLASSES[tone]}`}
  >
    {label}
  </span>
);
