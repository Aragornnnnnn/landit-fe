// 역할·상황 적기 — 고른 상대의 얼굴 아래 세 칸. 아래 「아이디어 추천받기」 하나가 세 칸을 한 조합으로 채운다
import { useTranslations } from 'next-intl';

import type { Partner } from '@/features/conversation/model/character-look';
import { PartnerAvatar } from '@/features/conversation/ui/character/PartnerAvatar';
import type { RoleplayDraft } from '@/features/roleplay/model/roleplay-draft';
import { findPartner } from '@/features/small-talk/model/partner';
import { GradientSparkle } from '@/shared/ui/GradientSparkle';

import { RoleplayField } from './RoleplayField';

interface RoleplayFormProps {
  partner: Partner;
  partnerName: string;
  draft: RoleplayDraft;
  ideaPending: boolean;
  onEdit: (field: keyof RoleplayDraft, value: string) => void;
  onRequestIdea: () => void;
}

export const RoleplayForm = ({
  partner,
  partnerName: name,
  draft,
  ideaPending,
  onEdit,
  onRequestIdea,
}: RoleplayFormProps) => {
  const t = useTranslations('roleplay');
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
        loading={ideaPending}
        autoFocus={empty}
        onChange={(value) => onEdit('myRole', value)}
      />
      <RoleplayField
        label={t('create.partnerRoleLabel', { name })}
        placeholder={t('create.partnerRolePlaceholder')}
        value={draft.partnerRole}
        size="line"
        loading={ideaPending}
        onChange={(value) => onEdit('partnerRole', value)}
      />
      <RoleplayField
        label={t('create.situationLabel')}
        placeholder={t('create.situationPlaceholder')}
        value={draft.situation}
        size="block"
        loading={ideaPending}
        onChange={(value) => onEdit('situation', value)}
      />

      {/* 입력칸보다 튀면 안 된다 — 흰 바탕 고스트 버튼에 반짝이만 그라데이션으로 */}
      <button
        type="button"
        onClick={onRequestIdea}
        disabled={ideaPending}
        className="flex h-12 items-center justify-center gap-1.5 rounded-lg border border-border bg-card text-15 font-bold text-foreground shadow-[0_4px_0_var(--border)] transition-[translate,box-shadow] duration-75 active:translate-y-1 active:shadow-none disabled:translate-y-1 disabled:shadow-none"
      >
        {ideaPending ? (
          <span className="size-4 animate-spin rounded-full border-2 border-primary/25 border-t-primary" />
        ) : (
          <GradientSparkle size={16} />
        )}
        {t(ideaPending ? 'create.ideaLoadingButton' : 'create.ideaButton')}
      </button>
    </div>
  );
};
