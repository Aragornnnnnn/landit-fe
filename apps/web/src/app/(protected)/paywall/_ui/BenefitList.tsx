// 프리미엄 혜택 목록 — 라인 아이콘 + 한 줄 문구 여섯 줄. 작은 폰에서는 글자와 간격을 한 단계 줄인다
import {
  CalendarIcon,
  GlobeIcon,
  HeartIcon,
  MessageSquareIcon,
  MicIcon,
  SparklesIcon,
} from '@/shared/ui/Icons';

import { PAYWALL_BENEFITS, type BenefitIcon } from '../_model/paywall-benefits';

const ICONS: Record<BenefitIcon, typeof CalendarIcon> = {
  calendar: CalendarIcon,
  globe: GlobeIcon,
  sparkles: SparklesIcon,
  mic: MicIcon,
  chat: MessageSquareIcon,
  heart: HeartIcon,
};

export const BenefitList = () => (
  <ul className="flex flex-col gap-2.5 px-6 pt-5 short:gap-1 short:pt-3">
    {PAYWALL_BENEFITS.map(({ icon, text }) => {
      const Icon = ICONS[icon];
      return (
        <li key={icon} className="flex items-center gap-3">
          <Icon size={20} className="shrink-0 text-primary short:size-[18px]" />
          <span className="text-[14px] leading-[1.3] font-medium text-foreground short:text-[13px]">
            {text}
          </span>
        </li>
      );
    })}
  </ul>
);
