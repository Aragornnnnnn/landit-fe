// 받은/보낸 칸 칩 — 탭 셸의 칩과 같은 규격을 쓴다. 다만 주소가 아니라 쿼리로 갈린다
import { TAB_CHIP_ROW, tabChipClass } from '@/shared/ui/tab-chip';

import { MAILBOX_BOXES, type MailboxBox } from '../model/box';

interface MailboxTabsProps {
  current: MailboxBox;
  onSelect: (box: MailboxBox) => void;
}

export const MailboxTabs = ({ current, onSelect }: MailboxTabsProps) => (
  <div role="group" aria-label="편지함" className={TAB_CHIP_ROW}>
    {MAILBOX_BOXES.map(({ box, label }) => {
      const isActive = box === current;

      return (
        <button
          key={box}
          type="button"
          aria-pressed={isActive}
          // 이미 열린 칸은 알리지 않는다 — 여기서 막아야 계측도 주소도 헛돌지 않는다
          onClick={() => !isActive && onSelect(box)}
          className={tabChipClass(isActive)}
        >
          {label}
        </button>
      );
    })}
  </div>
);
