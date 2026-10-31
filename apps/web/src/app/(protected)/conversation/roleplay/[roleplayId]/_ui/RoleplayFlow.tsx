// 롤플레이 대화 진입 — 세션이 열려야 첫 마디가 생기므로, 열릴 때까지 기다렸다가 본편을 띄운다
'use client';

import { EVENTS } from '@landit/analytics';
import { useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';

import { ConversationSkeleton } from '@/features/conversation/ui/ConversationSkeleton';
import { track } from '@/shared/analytics';
import { ROLEPLAY_PATH } from '@/shared/lib/routes';
import { Button } from '@/shared/ui/Button';

import { useRoleplaySession } from '../_model/useRoleplaySession';
import { RoleplayConversation } from './RoleplayConversation';

export const RoleplayFlow = ({ roleplayId }: { roleplayId: number }) => {
  const t = useTranslations('conversation.roleplayFlow');
  const router = useRouter();
  const { session, error } = useRoleplaySession(roleplayId);

  if (error) {
    return (
      <main className="mx-auto flex h-dvh max-w-[430px] flex-col items-center justify-center gap-4 bg-background px-6 text-center">
        <p className="break-keep text-muted-foreground">{t('startError')}</p>
        <Button
          variant="secondary"
          size="sm"
          className="w-auto px-6"
          onClick={() => {
            track(EVENTS.ERROR_RETRIED, { screen: 'conversation' });
            router.replace(ROLEPLAY_PATH);
          }}
        >
          {t('backButton')}
        </Button>
      </main>
    );
  }

  if (!session) return <ConversationSkeleton />;

  return <RoleplayConversation session={session} />;
};
