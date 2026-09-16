// 구독 관리 화면의 프리미엄 혜택 목록
import {
  CalendarIcon,
  GlobeIcon,
  ListChecksIcon,
  MessageSquareIcon,
  MicIcon,
  SparklesIcon,
} from '@/shared/ui/Icons';

import { PREMIUM_BENEFITS, type BenefitIcon } from '../model/benefits';

const ICONS: Record<BenefitIcon, typeof CalendarIcon> = {
  calendar: CalendarIcon,
  'list-checks': ListChecksIcon,
  globe: GlobeIcon,
  sparkles: SparklesIcon,
  mic: MicIcon,
  chat: MessageSquareIcon,
};

/**
 * 라인 아이콘 + 한 줄 문구로 {@link PREMIUM_BENEFITS}를 그린다. 구독 관리의 "이용 중인 혜택"이 쓴다
 * (페이월은 비교표를 쓴다). 다섯 줄이라 큰 폰에서는 조금 키우고 작은 폰에서는 한 단계 줄인다.
 */
export const BenefitList = () => (
  <ul className="flex flex-col gap-3 px-6 pt-5 short:gap-1 short:pt-3">
    {PREMIUM_BENEFITS.map(({ icon, text }) => {
      const Icon = ICONS[icon];
      return (
        <li key={icon} className="flex items-center gap-3">
          <Icon size={22} className="shrink-0 text-primary short:size-[18px]" />
          <span className="text-[15px] leading-[1.3] font-medium text-foreground short:text-[13px]">
            {text}
          </span>
        </li>
      );
    })}
  </ul>
);
