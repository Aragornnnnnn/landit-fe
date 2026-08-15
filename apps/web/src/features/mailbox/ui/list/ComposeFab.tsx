// 피드백 보내기 버튼 — 목록이 비어 있든 가득하든 늘 같은 자리에 떠 있다.
// 편지함 안(목록·유형 선택·작성)은 히스토리에 한 층만 쓴다 — 보내고 나서 휴대폰 뒤로가기를 누르면
// 편지함 목록이 아니라 들어오기 전 탭으로 나가야 해서, 목록 위에 작성 화면을 쌓지 않는다
import Link from 'next/link';

import { MAILBOX_COMPOSE_PATH } from '../../model/box';

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
