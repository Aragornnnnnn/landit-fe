// 피드백 보내기 버튼 — 목록이 비어 있든 가득하든 늘 같은 자리에 떠 있다.
// replace인 건 작성 흐름이 히스토리 한 층이라서다 (shared/lib/routes의 MAILBOX_COMPOSE_PATH 참고)
import { useTranslations } from 'next-intl';
import Link from 'next/link';

import { MAILBOX_COMPOSE_PATH } from '@/shared/lib/routes';

// FAB가 뜨는 높이 — 내비게이션 바·홈 인디케이터 위로 띄우되 최소 20px
const FAB_BOTTOM = 'max(var(--safe-area-inset-bottom), 20px)';
const FAB_HEIGHT_PX = 48;
// 마지막 편지와 FAB 사이에 남길 틈
const LIST_GAP_ABOVE_FAB_PX = 44;

// 목록이 FAB 뒤로 숨지 않으려면 이만큼 띄워야 한다 — FAB 바닥 여백 + FAB 높이 + 틈
export const COMPOSE_FAB_CLEARANCE = `calc(${FAB_BOTTOM} + ${FAB_HEIGHT_PX + LIST_GAP_ABOVE_FAB_PX}px)`;

export const ComposeFab = () => {
  const t = useTranslations('mailbox.composeFab');

  return (
    <Link
      replace
      href={MAILBOX_COMPOSE_PATH}
      style={{ bottom: FAB_BOTTOM, height: FAB_HEIGHT_PX }}
      className="absolute right-5 flex items-center gap-1.5 rounded-full bg-primary pr-5 pl-4 text-sm font-bold text-primary-foreground shadow-lg transition-transform active:scale-95"
    >
      <span aria-hidden className="text-lg leading-none">
        +
      </span>
      {t('button')}
    </Link>
  );
};
