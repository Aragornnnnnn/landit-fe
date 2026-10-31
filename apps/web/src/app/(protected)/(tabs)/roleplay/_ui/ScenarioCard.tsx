// 내 시나리오 카드 — 캐릭터 상반신이 카드 전면에 서고, 아래 어둠 위에 제목과 시각만 둔다. 카드를 누르면 다시 대화한다.
// 시안의 시각은 마지막으로 대화한 때지만, 백엔드가 아직 만든 때(createdAt)만 줘서 그 값을 쓴다
import { useLocale, useTranslations } from 'next-intl';

import type { RoleplaySettings } from '@/features/roleplay/api/roleplay';
import { toLastTalked } from '@/features/roleplay/model/last-talked';
import { PARTNER_TINT } from '@/features/roleplay/ui/partner-tint';
import { PartnerBust } from '@/features/roleplay/ui/PartnerBust';
import { toPartnerId } from '@/features/small-talk/model/partner';
import type { Locale } from '@/shared/i18n/locale';
import { toDayLabel } from '@/shared/lib/day-label';

interface ScenarioCardProps {
  scenario: RoleplaySettings;
  // 기기의 오늘(yyyy-MM-dd) — 카드마다 시계를 읽지 않게 목록이 한 번 읽어 내려준다
  today: string;
  onOpen: () => void;
}

export const ScenarioCard = ({
  scenario,
  today,
  onOpen,
}: ScenarioCardProps) => {
  const t = useTranslations('roleplay.home');
  const locale = useLocale() as Locale;
  const partner = toPartnerId(scenario.characterId);
  const timeLabel = () => {
    const lastTalked = toLastTalked(scenario.createdAt, today);
    switch (lastTalked.kind) {
      case 'today':
        return t('todayLabel');
      case 'daysAgo':
        return t('daysAgoLabel', { days: lastTalked.days });
      case 'date':
        return toDayLabel(scenario.createdAt, locale);
    }
  };

  return (
    <div
      className="relative aspect-[169/232] overflow-clip rounded-[20px] shadow-[0_6px_18px_rgba(0,0,0,0.08)]"
      style={{ background: PARTNER_TINT[partner] }}
    >
      <button
        type="button"
        onClick={onOpen}
        className="absolute inset-0 text-left transition-transform active:scale-[0.98]"
      >
        <PartnerBust
          partner={partner}
          className="absolute -bottom-[1%] left-1/2 w-[89%] -translate-x-1/2"
        />
        <span className="absolute inset-x-0 bottom-0 h-[56%] bg-linear-to-b from-[#1a0f08]/0 via-[#1a0f08]/55 to-[#1a0f08]/85" />
        <span className="absolute inset-x-3 bottom-3.5 flex flex-col gap-1">
          <span className="line-clamp-2 text-sm leading-[1.35] font-bold break-keep text-white">
            {scenario.title}
          </span>
          <span className="text-xs text-white/75">{timeLabel()}</span>
        </span>
      </button>
    </div>
  );
};
