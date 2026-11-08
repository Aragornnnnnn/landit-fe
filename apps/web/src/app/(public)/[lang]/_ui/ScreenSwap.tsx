'use client';

// 폰 화면 바꾸기 — 스크롤하는 만큼 그 화면을 여는 자리(origin)에서 원이 퍼지며 다음 화면이 첫 화면을 덮고, 되돌리면 다시 오므라든다. 반투명하게 겹치지 않아 두 화면이 섞여 보이지 않는다. 두 화면 모두 처음부터 문서에 있어 검색엔진과 낭독기가 둘 다 읽는다
import { useEffect, useRef } from 'react';
import Image from 'next/image';

import {
  revealClip,
  revealRing,
  type RevealOrigin,
} from '../_model/reveal-clip';
import { SCREEN_IMAGE } from '../_model/screen-image';
import { swapProgress } from '../_model/swap-progress';

type Screen = { src: string; alt: string };

export const ScreenSwap = ({
  first,
  next,
  origin,
}: {
  first: Screen;
  next: Screen;
  origin: RevealOrigin;
}) => {
  const phoneRef = useRef<HTMLDivElement>(null);
  const nextRef = useRef<HTMLDivElement>(null);
  const ringRef = useRef<HTMLDivElement>(null);

  // 스크롤마다 React를 다시 그리지 않고 원 크기만 바로 바꾼다
  useEffect(() => {
    const update = () => {
      const phone = phoneRef.current;
      const layer = nextRef.current;
      const ring = ringRef.current;
      if (!phone || !layer || !ring) return;
      // 폰 아래쪽은 판에 잘려 안 보이므로 눈에 보이는 판(data-phone-stage)의 가운데를 잰다
      const stage = phone.closest('[data-phone-stage]') ?? phone;
      const { top, height } = stage.getBoundingClientRect();
      const progress = swapProgress(top + height / 2, window.innerHeight);
      layer.style.clipPath = revealClip(progress, origin);
      const screen = phone.getBoundingClientRect();
      ring.style.background = revealRing(progress, origin, screen);
    };
    update();
    window.addEventListener('scroll', update, { passive: true });
    window.addEventListener('resize', update);
    return () => {
      window.removeEventListener('scroll', update);
      window.removeEventListener('resize', update);
    };
  }, [origin]);

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
        className="absolute inset-0"
        style={{ clipPath: revealClip(0, origin) }}
      >
        <Image
          src={next.src}
          alt={next.alt}
          {...SCREEN_IMAGE}
          className="w-full"
        />
      </div>
      {/* 퍼지는 원 가장자리의 밝은 띠 — 두 화면 배경이 같아도 화면 전체가 바뀌는 게 보인다 */}
      <div
        ref={ringRef}
        aria-hidden
        className="pointer-events-none absolute inset-0"
      />
    </div>
  );
};
