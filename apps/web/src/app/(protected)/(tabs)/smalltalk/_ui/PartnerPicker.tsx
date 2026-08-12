// 대화 상대 고르기 — 얼굴만 잘라 낸 아바타 셋. 고른 사람만 테두리가 생기고 이름이 진해진다
'use client';

import type { Partner } from '@/features/conversation/model/character-look';
import { PartnerAvatar } from '@/features/conversation/ui/character/PartnerAvatar';
import { PARTNERS } from '@/features/small-talk/model/partner';

interface PartnerPickerProps {
  selected: Partner;
  onSelect: (partner: Partner) => void;
}

export const PartnerPicker = ({ selected, onSelect }: PartnerPickerProps) => (
  // 낮은 화면에서는 위아래 여백부터 깎는다 — 스크롤 없는 화면이라 어디선가는 양보해야 한다
  <div className="flex justify-center gap-[22px] pt-3 pb-2 [@media(max-height:740px)]:pt-1 [@media(max-height:740px)]:pb-1">
    {PARTNERS.map((partner) => {
      const isSelected = partner.id === selected;

      return (
        <button
          key={partner.id}
          type="button"
          onClick={() => onSelect(partner.id)}
          aria-pressed={isSelected}
          className="flex flex-col items-center gap-[5px]"
        >
          {/* 원 배경은 탭 화면 배경(muted)과 같은 회색이라 그대로 두면 안 보인다 — 반투명으로 눌러 둔다.
              테두리는 늘 두고 색만 바꾼다 — 두께가 생겼다 사라지면 고를 때마다 그림 크기가 튀고,
              색이 기본값에서 물드는 과정이 검은 테를 스치게 한다 */}
          <span
            className={`flex size-[54px] items-center justify-center overflow-hidden rounded-full border-[2.5px] bg-muted-foreground/10 transition-colors ${
              isSelected ? 'border-primary' : 'border-transparent'
            }`}
          >
            {/* 고르지 않은 사람은 뒤로 물러나 있다 — 원 배경은 그대로 두고 그림만 흐리게 */}
            <PartnerAvatar
              partner={partner.id}
              viewBox={partner.avatarViewBox}
              className={isSelected ? 'size-full' : 'size-full opacity-50'}
            />
          </span>
          <span
            className={`flex items-center gap-1 text-[13px] transition-colors ${
              isSelected
                ? 'font-semibold text-foreground'
                : 'font-normal text-muted-foreground'
            }`}
          >
            {partner.name}
            <span className="tossface text-[11px]" aria-hidden>
              {partner.flag}
            </span>
          </span>
        </button>
      );
    })}
  </div>
);
