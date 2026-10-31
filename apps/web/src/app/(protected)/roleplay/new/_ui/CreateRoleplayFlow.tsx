'use client';

// 나만의 시나리오 만들기 화면 — 단계마다 머리·본문·바닥 버튼만 바뀌고 껍데기는 그대로다
import { useTranslations } from 'next-intl';

import { PageHeader } from '@/app/(protected)/_ui/PageHeader';
import { findPartner } from '@/features/small-talk/model/partner';
import { useKeyboardInset } from '@/shared/lib/useKeyboardInset';
import { Button } from '@/shared/ui/Button';

import { useCreateRoleplayFlow } from '../_model/useCreateRoleplayFlow';
import { CardShuffle } from './CardShuffle';
import { PartnerCarousel } from './PartnerCarousel';
import { RoleplayForm } from './RoleplayForm';

export const CreateRoleplayFlow = () => {
  const t = useTranslations('roleplay.create');
  const tSmallTalk = useTranslations('smallTalk');
  const flow = useCreateRoleplayFlow();
  // iOS WebView는 키보드가 떠도 dvh가 줄지 않는다 — 가린 만큼 화면을 줄여 시작하기와 쓰는 칸이 키보드 위에 남게 한다
  const keyboardInset = useKeyboardInset();
  const partnerName = tSmallTalk(findPartner(flow.partner).nameKey);

  return (
    <main
      className="mx-auto flex max-w-[430px] flex-col bg-muted"
      style={{
        height: `calc(100dvh - ${keyboardInset}px)`,
        paddingTop: 'var(--safe-area-inset-top)',
      }}
    >
      {flow.step === 'generating' ? (
        <CardShuffle partner={flow.partner} partnerName={partnerName} />
      ) : (
        <>
          <PageHeader title={t('headerTitle')} onBack={flow.goBack} />
          {/* 입력 단계는 아바타가 머리 바로 아래에 붙는다 — 상대 고르기보다 위 여백이 좁다(시안 좌표) */}
          <div
            className={`min-h-0 flex-1 overflow-y-auto px-5 pb-4 ${flow.step === 'partner' ? 'pt-3' : 'pt-1'}`}
          >
            {flow.step === 'partner' ? (
              <>
                <h2 className="text-center text-22 font-bold text-foreground">
                  {t('partnerTitle')}
                </h2>
                <PartnerCarousel
                  index={flow.partnerIndex}
                  onShow={flow.showPartner}
                />
              </>
            ) : (
              <RoleplayForm
                partner={flow.partner}
                partnerName={partnerName}
                draft={flow.draft}
                ideaPending={flow.ideaPending}
                onEdit={flow.editField}
                onRequestIdea={flow.requestIdea}
              />
            )}
          </div>
          <div className="px-5 pt-2 pb-[max(var(--safe-area-inset-bottom),24px)]">
            {flow.step === 'partner' ? (
              <Button onClick={flow.confirmPartner}>
                {t('continueButton')}
              </Button>
            ) : (
              <Button disabled={!flow.canStart} onClick={flow.startCreate}>
                {t('startButton')}
              </Button>
            )}
          </div>
        </>
      )}
    </main>
  );
};
