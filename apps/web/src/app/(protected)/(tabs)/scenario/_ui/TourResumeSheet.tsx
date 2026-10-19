'use client';

// 첫 표현 투어를 하다 나간 사람이 돌아왔을 때 — 래디가 이어서 하자고 한 번 안내한다
import { BottomSheet } from '@/shared/ui/BottomSheet';
import { Button } from '@/shared/ui/Button';

export const TourResumeSheet = ({ onContinue }: { onContinue: () => void }) => (
  <BottomSheet open onClose={onContinue}>
    <div className="flex flex-col items-center text-center">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/images/character/landy-genie.webp"
        alt="래디"
        className="size-28 object-contain"
      />
      <BottomSheet.Title className="mt-3 text-[22px] font-extrabold text-foreground">
        아까 하다 나갔죠?
      </BottomSheet.Title>
      <p className="mt-2 text-base font-medium text-muted-foreground">
        하던 곳부터 이어서 알려 드릴게요
      </p>
      <div className="mt-6 w-full">
        <Button onClick={onContinue}>이어서 할게요</Button>
      </div>
    </div>
  </BottomSheet>
);
