// 편지 한 줄 — 칩·날짜 / 제목 / 미리보기 3단. 구분선은 리스트가 사이에 깐다
import { formatLetterDate } from '../../lib/letter-date';
import type { LetterRow } from '../../model/letter-row';
import { LetterBadge } from '../LetterBadge';

export const LetterListItem = ({ row }: { row: LetterRow }) => (
  <div className="py-4">
    <div className="flex items-center justify-between gap-2">
      <LetterBadge label={row.badge.label} tone={row.badge.tone} />
      <time className="text-xs text-muted-foreground">
        {formatLetterDate(row.sentAt)}
      </time>
    </div>

    <div className="mt-2.5 flex items-center gap-1.5">
      {row.unread && (
        // 점은 장식이라 읽어 주지 않는다 — 안 읽었다는 사실은 제목 옆 문구가 대신 말한다
        <span
          aria-hidden
          className="size-1.5 shrink-0 rounded-full bg-letter-unread"
        />
      )}
      <h2
        className={`truncate text-[15px] text-foreground ${
          row.unread ? 'font-bold' : 'font-semibold'
        }`}
      >
        {row.title}
        {row.unread && <span className="sr-only"> (안 읽음)</span>}
      </h2>
    </div>

    <p className="mt-1.5 truncate text-[13px] text-muted-foreground">
      {row.preview}
    </p>
  </div>
);
