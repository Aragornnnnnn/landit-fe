'use client';

// 폰 화면 바꾸기 — 스크롤하는 만큼 다음 화면이 폰 아래에서 올라와 첫 화면을 덮고, 되돌리면 다시 내려간다. 반투명하게 겹치지 않아 두 화면이 섞여 보이지 않는다. 두 화면 모두 처음부터 문서에 있어 검색엔진과 낭독기가 둘 다 읽는다
import { useEffect, useRef } from 'react';
import Image from 'next/image';

import { SCREEN_IMAGE } from '../_model/screen-image';
import { swapProgress } from '../_model/swap-progress';

type Screen = { src: string; alt: string };

export const ScreenSwap = ({
  first,
  next,
}: {
  first: Screen;
  next: Screen;
}) => {
  const phoneRef = useRef<HTMLDivElement>(null);
  const nextRef = useRef<HTMLDivElement>(null);

  // 스크롤마다 React를 다시 그리지 않고 위치만 바로 바꾼다
  useEffect(() => {
    const update = () => {
      const phone = phoneRef.current;
      const layer = nextRef.current;
      if (!phone || !layer) return;
      // 폰 아래쪽은 판에 잘려 안 보이므로 눈에 보이는 판(data-phone-stage)의 가운데를 잰다
      const stage = phone.closest('[data-phone-stage]') ?? phone;
      const { top, height } = stage.getBoundingClientRect();
      const hidden = 1 - swapProgress(top + height / 2, window.innerHeight);
      layer.style.transform = `translateY(${Math.round(hidden * 1000) / 10}%)`;
    };
    update();
    window.addEventListener('scroll', update, { passive: true });
    window.addEventListener('resize', update);
    return () => {
      window.removeEventListener('scroll', update);
      window.removeEventListener('resize', update);
    };
  }, []);

  return (
    <div ref={phoneRef} className="relative">
      <Image
        src={first.src}
        alt={first.alt}
        {...SCREEN_IMAGE}
        className="w-full"
      />
      <div
        ref={nextRef}
        className="absolute inset-0 shadow-[0_-10px_24px_rgba(0,0,0,0.12)] will-change-transform"
        style={{ transform: 'translateY(100%)' }}
      >
        <Image
          src={next.src}
          alt={next.alt}
          {...SCREEN_IMAGE}
          className="w-full"
        />
      </div>
    </div>
  );
};
