// 피드백 보내기 버튼 — 목록이 비어 있든 가득하든 늘 같은 자리에 떠 있다.
// replace인 건 작성 흐름이 히스토리 한 층이라서다 (shared/lib/routes의 MAILBOX_COMPOSE_PATH 참고)
import Link from 'next/link';

import { MAILBOX_COMPOSE_PATH } from '@/shared/lib/routes';

// 목록이 FAB 뒤로 숨지 않으려면 이만큼 띄워야 한다 — 아래 높이(h-12)와 바닥 여백의 합
export const COMPOSE_FAB_CLEARANCE = 'pb-28';

export const ComposeFab = () => (
  <Link
    replace
    href={MAILBOX_COMPOSE_PATH}
    className="absolute right-5 bottom-[max(env(safe-area-inset-bottom),20px)] flex h-12 items-center gap-1.5 rounded-full bg-primary pr-5 pl-4 text-sm font-bold text-primary-foreground shadow-lg transition-transform active:scale-95"
  >
    <span aria-hidden className="text-lg leading-none">
      +
    </span>
    피드백 보내기
  </Link>
);
