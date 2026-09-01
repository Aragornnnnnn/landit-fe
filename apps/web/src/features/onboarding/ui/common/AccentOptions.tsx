// 배울 영어 선택지 목록 — 온보딩 스텝과 마이페이지 변경이 함께 쓴다.
// 고르면 하이라이트만 되고, 실제 확정은 각 화면의 CTA가 맡는다 (영어 수준 선택지와 같은 카드다)
'use client';

import type { AccentLocale } from '@landit/analytics';
import Image, { type StaticImageData } from 'next/image';

import auFlag from '../../assets/flag/au.svg';
import gbFlag from '../../assets/flag/gb.svg';
import usFlag from '../../assets/flag/us.svg';
import { ACCENTS } from '../../model/accent';

// Record라 선택지가 늘면 국기 누락이 타입 에러로 잡힌다
const FLAGS: Record<AccentLocale, StaticImageData> = {
  EN_US: usFlag,
  EN_GB: gbFlag,
  EN_AU: auFlag,
};

export const AccentOptions = ({
  selected,
  onSelect,
}: {
  // null이면 아무것도 강조하지 않는다 — 지금 값을 아직 모를 때다
  selected: AccentLocale | null;
  onSelect: (locale: AccentLocale) => void;
}) => (
  <div className="flex flex-col gap-3">
    {ACCENTS.map((item) => {
      const isSelected = selected === item.locale;
      return (
        <button
          key={item.locale}
          type="button"
          onClick={() => onSelect(item.locale)}
          aria-pressed={isSelected}
          className={`flex w-full items-center gap-3 rounded-2xl px-4 py-4 text-left transition-[translate,box-shadow,background-color] duration-75 ${
            isSelected
              ? 'translate-y-[3px] bg-selected shadow-none'
              : 'bg-card shadow-[0_3px_0_var(--border)] active:translate-y-[3px] active:shadow-none'
          }`}
        >
          {/* 국기는 3:2 비율 그대로 — 모서리 라운드는 에셋에 들어 있다 */}
          <Image
            src={FLAGS[item.locale]}
            alt=""
            width={30}
            height={20}
            className="shrink-0"
          />
          <span className="text-base font-extrabold text-foreground">
            {item.label}
          </span>
        </button>
      );
    })}
  </div>
);
