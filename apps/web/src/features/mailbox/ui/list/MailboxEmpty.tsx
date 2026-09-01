// 편지가 한 통도 없을 때 — 칸마다 없다는 사실의 뜻이 달라서 문구를 따로 쓴다
import { Emoji } from '@/shared/ui/emoji';

import type { MailboxBox } from '../../model/box';

const COPY: Record<MailboxBox, { emoji: string; title: string; body: string }> =
  {
    received: {
      emoji: '📭',
      title: '아직 도착한 편지가 없어요',
      body: '공지나 답장이 도착하면 여기에서 확인할 수 있어요',
    },
    sent: {
      emoji: '✉️',
      title: '아직 보낸 편지가 없어요',
      body: '궁금한 점이나 의견이 있다면 언제든 편하게 보내주세요',
    },
  };

export const MailboxEmpty = ({ box }: { box: MailboxBox }) => {
  const { emoji, title, body } = COPY[box];

  return (
    <div className="flex flex-col items-center px-8 pt-24 text-center">
      <span className="flex size-[140px] items-center justify-center rounded-full bg-secondary text-5xl">
        <Emoji>{emoji}</Emoji>
      </span>
      <p className="mt-7 text-base font-bold text-foreground">{title}</p>
      <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
        {body}
      </p>
    </div>
  );
};
