// 온보딩을 지나간 기존 유저에게 알림 허용을 청하는 풀스크린 프롬프트 (피그마 901:322)
'use client';

import { Button } from '@/shared/ui/Button';

import { LockScreenMockup } from './LockScreenMockup';

export const NotificationConsentPrompt = ({
  onAccept,
  onDismiss,
}: {
  onAccept: () => void;
  onDismiss: () => void;
}) => (
  <div
    role="dialog"
    aria-modal="true"
    aria-label="알림 허용 안내"
    className="fixed inset-0 z-50 bg-background text-foreground"
  >
    <div
      className="mx-auto flex h-full max-w-[430px] flex-col px-6"
      style={{
        paddingTop: 'max(env(safe-area-inset-top), 48px)',
        paddingBottom: 'max(env(safe-area-inset-bottom), 20px)',
      }}
    >
      <h1 className="pt-6 text-3xl leading-[1.18] font-black tracking-normal">
        꾸준한 학습을 위해
        <br />
        알림으로 도와드릴게요
      </h1>
      <p className="mt-4 text-xl font-bold text-muted-foreground">
        오늘의 대화를 잊고 있다면 알려드려요
      </p>

      <div className="flex flex-1 items-center justify-center py-6">
        <LockScreenMockup
          title="오늘만 가능한 시나리오 도착 💌"
          body="자기 전 5분으로 불꽃을 지키세요"
        />
      </div>

      <Button onClick={onAccept}>알림 받을게요!</Button>
      <button
        type="button"
        onClick={onDismiss}
        className="mt-2 flex h-12 items-center justify-center text-[15px] font-semibold text-muted-foreground"
      >
        나중에 할게요
      </button>
    </div>
  </div>
);
