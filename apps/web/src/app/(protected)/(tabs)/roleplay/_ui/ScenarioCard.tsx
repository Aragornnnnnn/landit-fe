// 내 시나리오 카드 — 캐릭터 상반신이 카드 전면에 서고, 아래 어둠 위에 제목과 마지막 대화 시각만 둔다.
// 카드를 누르면 다시 대화하고, 모서리 ⋯는 지난 대화·삭제를 연다
import { useLocale, useTranslations } from 'next-intl';

import type { RoleplayScenario } from '@/features/roleplay/api/roleplay';
import { toLastTalked } from '@/features/roleplay/model/last-talked';
import { PARTNER_TINT } from '@/features/roleplay/ui/partner-tint';
import { PartnerBust } from '@/features/roleplay/ui/PartnerBust';
import type { Locale } from '@/shared/i18n/locale';
import { toDayLabel } from '@/shared/lib/day-label';
import { MoreHorizontalIcon } from '@/shared/ui/Icons';

interface ScenarioCardProps {
  scenario: RoleplayScenario;
  // 기기의 오늘(yyyy-MM-dd) — 카드마다 시계를 읽지 않게 목록이 한 번 읽어 내려준다
  today: string;
  onOpen: () => void;
  onMore: () => void;
}

export const ScenarioCard = ({
  scenario,
  today,
  onOpen,
  onMore,
}: ScenarioCardProps) => {
  const t = useTranslations('roleplay.home');
  const locale = useLocale() as Locale;
  const lastTalkedLabel = () => {
    const lastTalked = toLastTalked(scenario.lastTalkedAt, today);
    switch (lastTalked.kind) {
      case 'today':
        return t('todayLabel');
      case 'daysAgo':
        return t('daysAgoLabel', { days: lastTalked.days });
      case 'date':
        return toDayLabel(scenario.lastTalkedAt, locale);
    }
  };

  return (
    <div
      className="relative aspect-[169/232] overflow-clip rounded-[20px] shadow-[0_6px_18px_rgba(0,0,0,0.08)]"
      style={{ background: PARTNER_TINT[scenario.partner] }}
    >
      <button
        type="button"
        onClick={onOpen}
        className="absolute inset-0 text-left transition-transform active:scale-[0.98]"
      >
        <PartnerBust
          partner={scenario.partner}
          className="absolute -bottom-[1%] left-1/2 w-[89%] -translate-x-1/2"
        />
        <span className="absolute inset-x-0 bottom-0 h-[56%] bg-linear-to-b from-[#1a0f08]/0 via-[#1a0f08]/55 to-[#1a0f08]/85" />
        <span className="absolute inset-x-3 bottom-3.5 flex flex-col gap-1">
          <span className="line-clamp-2 text-sm leading-[1.35] font-bold break-keep text-white">
            {scenario.title}
          </span>
          <span className="text-xs text-white/75">{lastTalkedLabel()}</span>
        </span>
      </button>
      {/* 눈에 띄면 카드보다 먼저 읽힌다 — 바탕 없는 흰 점 셋으로 연하게 둔다 */}
      <button
        type="button"
        onClick={onMore}
        aria-label={t('moreLabel', { title: scenario.title })}
        className="absolute top-2 right-2 flex size-8 items-center justify-center text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.25)] active:opacity-60"
      >
        <MoreHorizontalIcon size={20} />
      </button>
    </div>
  );
};
