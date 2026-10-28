// 편지가 한 통도 없을 때 — 칸마다 없다는 사실의 뜻이 달라서 문구를 따로 쓴다
import { useTranslations } from 'next-intl';

import { Emoji } from '@/shared/ui/emoji';

import type { MailboxBox } from '../../model/box';

// 문구는 mailbox.mailboxEmpty 아래
const COPY = {
  received: {
    emoji: '📭',
    titleKey: 'receivedTitle',
    descriptionKey: 'receivedDescription',
  },
  sent: {
    emoji: '✉️',
    titleKey: 'sentTitle',
    descriptionKey: 'sentDescription',
  },
} as const satisfies Record<MailboxBox, object>;

export const MailboxEmpty = ({ box }: { box: MailboxBox }) => {
  const t = useTranslations('mailbox.mailboxEmpty');
  const { emoji, titleKey, descriptionKey } = COPY[box];

  return (
    <div className="flex flex-col items-center px-8 pt-24 text-center">
      <span className="flex size-[140px] items-center justify-center rounded-full bg-secondary text-5xl">
        <Emoji>{emoji}</Emoji>
      </span>
      <p className="mt-7 text-base font-bold text-foreground">{t(titleKey)}</p>
      <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
        {t(descriptionKey)}
      </p>
    </div>
  );
};
