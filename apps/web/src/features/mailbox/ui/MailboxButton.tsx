'use client';

// 헤더에서 편지함으로 들어가는 칸 — 안 읽은 편지가 있으면 점으로 알린다
import { MAILBOX_PATH } from '@/shared/lib/routes';
import { HeaderAction } from '@/shared/ui/HeaderAction';
import { MailIcon } from '@/shared/ui/Icons';

import { useUnreadCountQuery } from '../model/useUnreadCountQuery';

export const MailboxButton = () => {
  const { hasUnread } = useUnreadCountQuery();

  return (
    <HeaderAction
      href={MAILBOX_PATH}
      label={hasUnread ? '편지함, 안 읽은 편지 있음' : '편지함'}
    >
      <span className="relative">
        <MailIcon size={18} />
        {hasUnread && (
          // 점은 장식이라 읽어 주지 않는다 — 안 읽었다는 사실은 위 라벨이 대신 말한다
          <span
            aria-hidden
            className="absolute -top-0.5 -right-1 size-1.5 rounded-full bg-letter-unread"
          />
        )}
      </span>
    </HeaderAction>
  );
};
