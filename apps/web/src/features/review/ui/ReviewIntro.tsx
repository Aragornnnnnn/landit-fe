'use client';

// 복습 시작 안내 — 알림으로 들어온 첫 화면. 얼마나 걸리는지만 알리고 시작을 받는다.
// 문제 수는 시작해야 서버가 열어 주므로(시작 전 questions는 빈 배열) 개수는 말하지 않는다
import Image from 'next/image';

import type { PreloadableImage } from '@/shared/lib/preload-next-images';
import { Button } from '@/shared/ui/Button';
import { CloseIcon } from '@/shared/ui/Icons';

/** 시작 안내의 그림 — 조회 중에 미리 받아 두려고 밖에서도 같은 주소를 쓴다 */
export const LANDY_QUIZ: PreloadableImage = {
  src: '/images/character/landy-quiz.webp',
  width: 200,
  height: 200,
};

interface ReviewIntroProps {
  onStart: () => void;
  starting: boolean;
  onClose: () => void;
}

export const ReviewIntro = ({
  onStart,
  starting,
  onClose,
}: ReviewIntroProps) => (
  <main
    className="mx-auto flex h-dvh max-w-[430px] flex-col bg-background px-6"
    style={{ paddingTop: 'env(safe-area-inset-top)' }}
  >
    <header className="flex h-14 flex-none items-center">
      <button
        onClick={onClose}
        aria-label="나가기"
        className="-ml-2 flex size-10 items-center justify-center text-foreground"
      >
        <CloseIcon size={24} />
      </button>
    </header>

    {/* 제목 크기는 온보딩 스텝과 같은 규격. 부제는 두지 않는다 — 제목과 CTA가 이미 다 말한다 */}
    <h1 className="text-3xl leading-[1.18] font-black tracking-normal break-keep">
      배웠던 표현
      <br />
      <span className="text-primary">3분</span> 퀴즈로 복습해요
    </h1>

    <div className="flex flex-1 items-center justify-center">
      <Image
        {...LANDY_QUIZ}
        alt=""
        priority
        className="h-[200px] w-auto drop-shadow-[0_8px_16px_rgba(0,0,0,0.12)]"
      />
    </div>

    <div className="pt-4 pb-[max(env(safe-area-inset-bottom),24px)]">
      <Button loading={starting} onClick={onStart}>
        복습 시작할게요
      </Button>
    </div>
  </main>
);
