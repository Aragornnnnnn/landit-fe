// 답장을 기다리는 중 — 답장이 붙을 자리에 빈 상태처럼 가운데 앉힌다. 답장이 오면 이 자리가 답장으로 바뀐다
import { useTranslations } from 'next-intl';

import { Emoji } from '@/shared/ui/emoji';

export const WaitingNotice = () => {
  const t = useTranslations('mailbox.waitingNotice');

  return (
    <div className="flex flex-col items-center border-t border-border pt-8 pb-2 text-center">
      <Emoji className="text-3xl">🕊️</Emoji>
      <p className="mt-3 text-sm font-semibold text-foreground">{t('title')}</p>
      <p className="mt-1 text-13 text-muted-foreground">{t('description')}</p>
    </div>
  );
};
