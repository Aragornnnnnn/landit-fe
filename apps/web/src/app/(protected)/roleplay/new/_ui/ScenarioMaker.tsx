// 시나리오를 만드는 동안 — 흐린 카드에 빛이 지나가다가, 저장과 첫 발화가 끝나면 선명해지며 제목이 나온다. rAF가 멈춰도 보이도록 움직임은 CSS로만 한다
import { useTranslations } from 'next-intl';

import type { Partner } from '@/features/conversation/model/character-look';
import type { RoleplayDraft } from '@/features/roleplay/model/roleplay-draft';
import {
  CARD_SHADE_CLASS,
  PARTNER_GLOW,
  PARTNER_TINT,
} from '@/features/roleplay/ui/partner-tint';
import { PartnerBust } from '@/features/roleplay/ui/PartnerBust';
import { useBackPress } from '@/shared/bridge/useBackPress';
import { Button } from '@/shared/ui/Button';

interface ScenarioMakerProps {
  partner: Partner;
  partnerName: string;
  draft: RoleplayDraft;
  // 다 만들어지면 서버가 지은 제목. 그 전엔 null
  title: string | null;
  // 오래 걸려 돌아갈 길을 보여 준다
  slow: boolean;
  onLeave: () => void;
}

export const ScenarioMaker = ({
  partner,
  partnerName,
  draft,
  title,
  slow,
  onLeave,
}: ScenarioMakerProps) => {
  const t = useTranslations('roleplay.generating');
  const done = title !== null;
  // 뒤로가기는 버튼이 뜨기 전에도 받는다. 다 만들어 넘어가는 중엔 아무 일도 하지 않는다
  useBackPress(() => {
    if (!done) onLeave();
  });
  const lines = [
    { label: t('myRoleLabel'), text: draft.myRole },
    { label: partnerName, text: draft.partnerRole },
    { label: t('situationLabel'), text: draft.situation },
  ];

  return (
    <div className="relative flex flex-1 flex-col items-center justify-center overflow-hidden pb-10">
      <div className="relative h-[336px] w-[240px]">
        <div
          aria-hidden
          className={`absolute -inset-16 transition-opacity duration-500 ${done ? 'opacity-90' : 'opacity-50'}`}
          style={{ background: PARTNER_GLOW[partner] }}
        />
        <div
          className={`relative size-full overflow-hidden rounded-[24px] shadow-[0_16px_40px_rgba(0,0,0,0.12)] ${done ? 'animate-maker-pop' : 'animate-maker-rise'}`}
          style={{ background: PARTNER_TINT[partner] }}
        >
          <PartnerBust
            partner={partner}
            className="absolute -bottom-[1%] left-1/2 w-[92%] -translate-x-1/2"
          />
          {/* 만드는 동안 흐리다가 완성되는 순간 걷힌다 */}
          <span
            className={`absolute inset-0 bg-background transition-opacity duration-100 ${done ? 'opacity-0' : 'opacity-40'}`}
          />
          {!done && (
            <span className="animate-maker-sweep absolute inset-y-0 -left-2/3 w-2/3 bg-linear-to-r from-white/0 via-white/60 to-white/0" />
          )}
          <span
            className={`absolute inset-x-0 bottom-0 h-[46%] transition-opacity duration-100 ${CARD_SHADE_CLASS} ${done ? 'opacity-100' : 'opacity-0'}`}
          />
          {done && (
            <p className="animate-maker-rise absolute inset-x-4 bottom-4 line-clamp-2 text-lg leading-snug font-bold break-keep text-white">
              {title}
            </p>
          )}
        </div>
      </div>

      <h1
        key={done ? 'done' : 'making'}
        aria-live="polite"
        className={`mt-9 text-center text-xl font-bold text-foreground ${done ? 'animate-maker-rise' : ''}`}
      >
        {done ? t('doneTitle') : t(slow ? 'slowTitle' : 'title')}
      </h1>

      <ul className="mt-5 flex w-[240px] flex-col items-center gap-1">
        {lines.map((line, index) => (
          <li
            key={line.label}
            className="animate-maker-rise flex max-w-full justify-center gap-1.5 text-sm"
            style={{ animationDelay: `${0.15 + index * 0.12}s` }}
          >
            <span className="shrink-0 text-muted-foreground">{line.label}</span>
            <span className="min-w-0 truncate font-medium text-foreground">
              {line.text}
            </span>
          </li>
        ))}
      </ul>

      {slow && !done && (
        <div className="absolute inset-x-0 bottom-0 px-5 pb-[max(var(--safe-area-inset-bottom),24px)]">
          <Button variant="ghost" onClick={onLeave}>
            {t('backButton')}
          </Button>
        </div>
      )}
    </div>
  );
};
