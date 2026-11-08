'use client';

// 폰 화면 바꾸기 — 스크롤하는 만큼 다음 화면으로 넘어가고, 되돌리면 다시 돌아온다. 그 화면을 여는 자리(origin)에서 가장자리가 흐린 원이 퍼지거나(spread), 카드를 넘기듯 좌우로 밀어 넘긴다(slide). 두 화면 모두 처음부터 문서에 있어 검색엔진과 낭독기가 둘 다 읽는다
import { useEffect, useRef } from 'react';
import Image from 'next/image';

import {
  revealMask,
  slideShift,
  type RevealOrigin,
} from '../_model/reveal-clip';
import { SCREEN_IMAGE } from '../_model/screen-image';
import { swapProgress } from '../_model/swap-progress';

type Screen = { src: string; alt: string };

export type Transition =
  { type: 'spread'; origin: RevealOrigin } | { type: 'slide' };

/** 첫 그리기 때 다음 화면을 가리는 마스크 — 크기를 재기 전이라 진행도 0의 값을 쓴다 */
const HIDDEN = revealMask(0, { x: 0, y: 0 }, { width: 0, height: 0 });

export const ScreenSwap = ({
  first,
  next,
  transition,
}: {
  first: Screen;
  next: Screen;
  transition: Transition;
}) => {
  const phoneRef = useRef<HTMLDivElement>(null);
  const firstRef = useRef<HTMLDivElement>(null);
  const nextRef = useRef<HTMLDivElement>(null);

  // 스크롤마다 React를 다시 그리지 않고 스타일만 바로 바꾼다
  useEffect(() => {
    const update = () => {
      const phone = phoneRef.current;
      const firstLayer = firstRef.current;
      const nextLayer = nextRef.current;
      if (!phone || !firstLayer || !nextLayer) return;
      // 폰 아래쪽은 판에 잘려 안 보이므로 눈에 보이는 판(data-phone-stage)의 가운데를 잰다
      const stage = phone.closest<HTMLElement>('[data-phone-stage]') ?? phone;
      const { top, height } = stage.getBoundingClientRect();
      const progress = swapProgress(top + height / 2, window.innerHeight);
      if (transition.type === 'slide') {
        const shift = slideShift(progress);
        firstLayer.style.transform = shift.first;
        nextLayer.style.transform = shift.next;
        return;
      }
      const mask = revealMask(
        progress,
        transition.origin,
        phone.getBoundingClientRect(),
      );
      nextLayer.style.maskImage = mask;
      // iOS 15.3 이하 사파리는 접두어로만 마스크를 읽는다
      nextLayer.style.webkitMaskImage = mask;
    };
    update();
    window.addEventListener('scroll', update, { passive: true });
    window.addEventListener('resize', update);
    return () => {
      window.removeEventListener('scroll', update);
      window.removeEventListener('resize', update);
    };
  }, [transition]);

  return (
    <div ref={phoneRef} className="relative overflow-hidden">
      <div ref={firstRef}>
        <Image
          src={first.src}
          alt={first.alt}
          {...SCREEN_IMAGE}
          className="w-full"
        />
      </div>
      <div
        ref={nextRef}
        className="absolute inset-0"
        style={
          transition.type === 'slide'
            ? { transform: slideShift(0).next }
            : { maskImage: HIDDEN, WebkitMaskImage: HIDDEN }
        }
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
