// 답장 아래 붙는 내 원문 인용 — 무엇에 대한 답장인지 다시 찾아보지 않게 한다
import { Emoji } from '@/shared/ui/emoji';

export const QuotedLetter = ({ text }: { text: string }) => (
  <div className="rounded-2xl bg-secondary p-4">
    <p className="text-xs font-semibold text-muted-foreground">
      <Emoji>✉️</Emoji> 내가 보낸 내용
    </p>
    <p className="mt-2 text-sm leading-relaxed whitespace-pre-line text-muted-foreground">
      {text}
    </p>
  </div>
);
