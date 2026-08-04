// 온보딩 5단계 — 매일 저녁 알림이 오는 모습을 잠금화면 목업으로 보여주고 알림 허용을 청한다
'use client';

import { LockScreenMockup } from '@/features/notification/ui/LockScreenMockup'; // 기존 유저 프롬프트와 같은 목업을 재사용한다
import { Button } from '@/shared/ui/Button';

export const NotificationStep = ({ onNext }: { onNext: () => void }) => (
  <>
    <div className="flex flex-1 flex-col pt-7">
      <h1 className="text-3xl leading-[1.18] font-black tracking-normal">
        꾸준한 학습을 위해
        <br />
        알림으로 도와드릴게요
      </h1>
      <p className="mt-4 text-xl font-bold text-muted-foreground">
        오늘의 대화를 잊고 있다면 알려드려요
      </p>

      <div className="flex flex-1 items-center justify-center py-6">
        <LockScreenMockup />
      </div>
    </div>

    <Button onClick={onNext}>알림 받을게요!</Button>
  </>
);
