// 역할·상황 적기 — 고른 상대의 얼굴 아래 세 칸. 아래 「아이디어 추천받기」 하나가 세 칸을 한 조합으로 채운다
import { useTranslations } from 'next-intl';

import type { Partner } from '@/features/conversation/model/character-look';
import { PartnerAvatar } from '@/features/conversation/ui/character/PartnerAvatar';
import {
  ROLE_MAX_LENGTH,
  SITUATION_MAX_LENGTH,
  type RoleplayDraft,
} from '@/features/roleplay/model/roleplay-draft';
import { findPartner } from '@/features/small-talk/model/partner';
import { GradientSparkle } from '@/shared/ui/GradientSparkle';

import { useDelayedFlag } from '../_model/useDelayedFlag';
import { RoleplayField } from './RoleplayField';

interface RoleplayFormProps {
  partner: Partner;
  partnerName: string;
  draft: RoleplayDraft;
  ideaPending: boolean;
  // 아이디어로 칸을 채운 횟수 — 늘 때마다 칸에 빛이 한 번 지나간다
  ideaFillCount: number;
  onEdit: (field: keyof RoleplayDraft, value: string) => void;
  onRequestIdea: () => void;
}

const IDEA_LOADING_DELAY_MS = 300;

export const RoleplayForm = ({
  partner,
  partnerName: name,
  draft,
  ideaPending,
  ideaFillCount,
  onEdit,
  onRequestIdea,
}: RoleplayFormProps) => {
  const t = useTranslations('roleplay');
  // 금방 끝나면 칸이 깜빡이지 않게, 오래 걸릴 때만 로딩을 보여 준다
  const ideaSlow = useDelayedFlag(ideaPending, IDEA_LOADING_DELAY_MS);
  const empty = !draft.myRole && !draft.partnerRole && !draft.situation;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col items-center gap-2 pb-1">
        <span className="size-22 overflow-hidden rounded-full bg-[#fdf1e8]">
          <PartnerAvatar
            partner={partner}
            viewBox={findPartner(partner).avatarViewBox}
            className="size-full"
          />
        </span>
        <span className="text-base font-bold text-foreground">{name}</span>
      </div>

      <RoleplayField
        label={t('create.myRoleLabel')}
        placeholder={t('create.myRolePlaceholder')}
        value={draft.myRole}
        size="line"
        maxLength={ROLE_MAX_LENGTH}
        locked={ideaPending}
        loading={ideaSlow}
        sweepCount={ideaFillCount}
        autoFocus={empty}
        onChange={(value) => onEdit('myRole', value)}
      />
      <RoleplayField
        label={t('create.partnerRoleLabel', { name })}
        placeholder={t('create.partnerRolePlaceholder')}
        value={draft.partnerRole}
        size="line"
        maxLength={ROLE_MAX_LENGTH}
        locked={ideaPending}
        loading={ideaSlow}
        sweepCount={ideaFillCount}
        onChange={(value) => onEdit('partnerRole', value)}
      />
      <RoleplayField
        label={t('create.situationLabel')}
        placeholder={t('create.situationPlaceholder')}
        value={draft.situation}
        size="block"
        maxLength={SITUATION_MAX_LENGTH}
        locked={ideaPending}
        loading={ideaSlow}
        sweepCount={ideaFillCount}
        onChange={(value) => onEdit('situation', value)}
      />

      {/* 입력칸보다 튀면 안 된다 — 흰 바탕 고스트 버튼에 반짝이만 그라데이션으로 */}
      <button
        type="button"
        onClick={onRequestIdea}
        disabled={ideaPending}
        aria-busy={ideaPending}
        className="flex h-12 items-center justify-center gap-1.5 rounded-lg border border-border bg-card text-15 font-bold text-foreground shadow-[0_4px_0_var(--border)] transition-[translate,box-shadow] duration-75 active:translate-y-1 active:shadow-none disabled:translate-y-1 disabled:shadow-none"
      >
        <GradientSparkle size={16} />
        {t('create.ideaButton')}
      </button>
    </div>
  );
};
