// 답장을 기다리는 중 — 답장이 붙을 자리에 빈 상태처럼 가운데 앉힌다. 답장이 오면 이 자리가 답장으로 바뀐다
import { Emoji } from '@/shared/ui/emoji';

export const WaitingNotice = () => (
  <div className="flex flex-col items-center border-t border-border pt-8 pb-2 text-center">
    <Emoji className="text-3xl">🕊️</Emoji>
    <p className="mt-3 text-sm font-semibold text-foreground">
      랜딧 팀이 읽고 있어요
    </p>
    <p className="mt-1 text-[13px] text-muted-foreground">
      꼼꼼히 읽고 답장드릴게요
    </p>
  </div>
);
