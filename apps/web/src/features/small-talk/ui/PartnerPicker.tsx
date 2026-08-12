// 대화 상대 고르기 — 얼굴만 잘라 낸 아바타 셋. 고른 사람만 테두리가 생기고 이름이 진해진다
'use client';

import type { Partner } from '@/entities/conversation/model/character-look';
import { PartnerPortrait } from '@/entities/conversation/ui/character/PartnerPortrait';

import { PARTNERS } from '../model/partner';

interface PartnerPickerProps {
  selected: Partner;
  onSelect: (partner: Partner) => void;
}

export const PartnerPicker = ({ selected, onSelect }: PartnerPickerProps) => (
  <div className="flex justify-center gap-[22px] pt-3 pb-2">
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
          {/* 테두리는 늘 두고 색만 바꾼다 — 두께가 생겼다 사라지면 고를 때마다 그림 크기가 튀고,
              색이 기본값에서 물드는 과정이 검은 테를 스치게 한다 */}
          <span
            className={`flex size-[54px] items-center justify-center overflow-hidden rounded-full border-[2.5px] bg-muted transition-colors ${
              isSelected ? 'border-primary' : 'border-transparent'
            }`}
          >
            {/* 고르지 않은 사람은 뒤로 물러나 있다 — 원 배경은 그대로 두고 그림만 흐리게 */}
            <PartnerPortrait
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
