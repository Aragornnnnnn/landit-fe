// 내 시나리오 카드 — 썸네일이 준비되면 그림을, 아니면 캐릭터 상반신을 전면에 두고, 아래 어둠 위에 제목과 마지막 대화 시각만 둔다.
// 카드를 누르면 다시 대화하고, 모서리 ⋯는 지난 대화·삭제를 연다
import { useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';

import type { RoleplaySettings } from '@/features/roleplay/api/roleplay';
import { toLastTalked } from '@/features/roleplay/model/last-talked';
import {
  CARD_SHADE_CLASS,
  toScenarioTint,
} from '@/features/roleplay/ui/partner-tint';
import { PartnerBust } from '@/features/roleplay/ui/PartnerBust';
import { toPartnerId } from '@/features/small-talk/model/partner';
import type { Locale } from '@/shared/i18n/locale';
import { toDayLabel } from '@/shared/lib/day-label';
import { MoreHorizontalIcon } from '@/shared/ui/Icons';

interface ScenarioCardProps {
  scenario: RoleplaySettings;
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
  const partner = toPartnerId(scenario.characterId);
  // 주소별로 기억해 재조회로 새 주소가 오면 다시 시도한다
  const [loadedUrl, setLoadedUrl] = useState<string | null>(null);
  const [failedUrl, setFailedUrl] = useState<string | null>(null);
  const thumbnailUrl =
    scenario.thumbnail?.status === 'READY' ? scenario.thumbnail.url : null;
  const thumbnailPainted = thumbnailUrl !== null && thumbnailUrl === loadedUrl;
  const talkedAt = scenario.lastPlayedAt ?? scenario.createdAt;
  const timeLabel = () => {
    const lastTalked = toLastTalked(talkedAt, today);
    switch (lastTalked.kind) {
      case 'today':
        return t('todayLabel');
      case 'daysAgo':
        return t('daysAgoLabel', { days: lastTalked.days });
      case 'date':
        return toDayLabel(talkedAt, locale);
    }
  };

  return (
    <div
      className="relative aspect-[169/232] overflow-clip rounded-[20px] shadow-[0_6px_18px_rgba(0,0,0,0.08)]"
      style={{ background: toScenarioTint(scenario.id) }}
    >
      <button
        type="button"
        onClick={onOpen}
        className="absolute inset-0 text-left transition-transform active:scale-[0.98]"
      >
        {/* 그림이 그려질 때까지 빈 카드가 보이지 않게 캐릭터를 세워 둔다 */}
        {!thumbnailPainted && (
          <PartnerBust
            partner={partner}
            className="absolute -bottom-[1%] left-1/2 w-[89%] -translate-x-1/2"
          />
        )}
        {thumbnailUrl && thumbnailUrl !== failedUrl && (
          // eslint-disable-next-line @next/next/no-img-element -- 썸네일 CDN 도메인을 next/image 허용 목록에 두지 않았다
          <img
            src={thumbnailUrl}
            loading="lazy"
            alt=""
            decoding="async"
            onLoad={() => setLoadedUrl(thumbnailUrl)}
            onError={() => setFailedUrl(thumbnailUrl)}
            className="absolute inset-0 size-full rounded-[20px] object-cover"
          />
        )}
        <span
          className={`absolute inset-x-0 bottom-0 h-[56%] ${CARD_SHADE_CLASS}`}
        />
        <span className="absolute inset-x-3 bottom-3.5 flex flex-col gap-1">
          <span className="line-clamp-2 text-sm leading-[1.35] font-bold break-keep text-white">
            {scenario.title}
          </span>
          <span className="text-xs text-white/75">{timeLabel()}</span>
        </span>
      </button>
      {/* 눈에 띄면 카드보다 먼저 읽힌다 — 바탕은 없이, 파스텔 위엔 어두운 점, 그림 위엔 그림자 진 흰 점으로 둔다 */}
      <button
        type="button"
        onClick={onMore}
        aria-label={t('moreLabel', { title: scenario.title })}
        className={`absolute top-1 right-1 flex size-11 items-center justify-center ${
          thumbnailPainted
            ? 'text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.7)]'
            : 'text-foreground/70'
        }`}
      >
        <MoreHorizontalIcon size={24} />
      </button>
    </div>
  );
};
