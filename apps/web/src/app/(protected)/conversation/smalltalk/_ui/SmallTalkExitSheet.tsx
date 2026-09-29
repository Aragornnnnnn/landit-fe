// 스몰톡 종료 확인 — X로 튕겨 나가는 대신 "직접 끝내보라"고 한 번 권한다.
// 작별 인사를 하면 상대가 알아채고 대화를 마무리해 주는데, 그 길을 모르면 X로만 나가게 된다.
// 그래도 끝내겠다면 종료 버튼이 대화를 완료로 처리해 피드백까지 이어 준다
'use client';

import Image from 'next/image';

import { BottomSheet } from '@/shared/ui/BottomSheet';
import { Button } from '@/shared/ui/Button';

interface SmallTalkExitSheetProps {
  open: boolean;
  // 대화 종료하기 — 지금 완료하고 오늘의 스몰톡으로 간다
  onComplete: () => void;
  // 직접 대화 마무리하기 — 시트를 닫고 작별 인사를 하러 대화로 돌아간다
  onClose: () => void;
}

export const SmallTalkExitSheet = ({
  open,
  onComplete,
  onClose,
}: SmallTalkExitSheetProps) => (
  <BottomSheet open={open} onClose={onClose}>
    <div className="flex flex-col items-center text-center">
      <Image
        src="/images/character/landy-crying.webp"
        alt=""
        width={96}
        height={96}
        className="size-24"
      />
      <h2 className="mt-1 text-[17px] font-bold break-keep text-foreground">
        대화를 잘 마무리하는 것까지가 영어 실력!
      </h2>
    </div>
    <div className="mt-4 rounded-2xl bg-selected px-4 py-3 text-left">
      <p className="text-[13px] font-semibold text-accent">직접 끝내볼래요?</p>
      <p className="mt-1 text-sm font-medium text-foreground">“Bye!”</p>
    </div>
    <Button className="mt-5" onClick={onClose}>
      직접 대화 마무리하기
    </Button>
    <button
      onClick={onComplete}
      className="mx-auto mt-3 block px-4 py-2 text-sm font-medium text-muted-foreground underline underline-offset-4"
    >
      대화 종료하기
    </button>
  </BottomSheet>
);
