'use client';

// 표현 설명 데모 — 실제 표현 설명 화면(그림 → 표현·스피커 → 예문·스피커)을 앱과 같은 순서로 보여준다.
// 그림이 먼저 보이고, 표현이 펼쳐지고, 예문이 소리와 함께 나온 뒤, 큰 래디 화면이 뉘앙스를 한 줄로 알려준다
import type { CSSProperties } from 'react';
import Image from 'next/image';

import { SpeakerIcon } from '@/shared/ui/Icons';

import { RANDY, SCENE_IMAGES } from '../_model/paywall-content';
import { appear, DemoScreen, type DemoProps } from './DemoScreen';

const EXAMPLE_SCENE = {
  image: 0,
  phrase: 1,
  sentence: 2,
  nuance: 3,
} as const;

/** 앱의 발음 듣기 버튼과 같은 모양 — 대기는 회색 배경, 재생 중엔 진한 배경에 흰 아이콘 */
const Speaker = ({ playing }: { playing: boolean }) => (
  <span
    className={`flex size-8 shrink-0 items-center justify-center rounded-full transition-colors ${
      playing ? 'bg-foreground text-white' : 'bg-[#f0f0ee] text-foreground'
    }`}
  >
    <SpeakerIcon size={16} />
  </span>
);

export const ExampleDemo = ({ step, width }: DemoProps) => (
  <DemoScreen width={width}>
    <div className="relative h-[290px] overflow-hidden">
      <Image
        src={SCENE_IMAGES.city}
        alt=""
        fill
        sizes="300px"
        className="animate-ken-burns object-cover"
      />
    </div>

    <div className={appear(step >= EXAMPLE_SCENE.phrase)}>
      <div className="flex items-center px-5 pt-5">
        <p className="flex-1 text-[30px] font-bold tracking-[-0.02em] text-foreground">
          <span className="text-primary">be up</span> for / be down for
        </p>
        <Speaker playing={step === EXAMPLE_SCENE.phrase} />
      </div>
      <p className="px-5 pt-1 text-base text-muted-foreground">
        ~할 마음이 있다, 콜이다
      </p>
    </div>

    <div
      className={`mx-5 mt-5 border-t border-[#ebebe8] pt-5 ${appear(step >= EXAMPLE_SCENE.sentence)}`}
    >
      <div className="flex items-start gap-3">
        <p className="flex-1 text-[22px] leading-snug text-foreground">
          Honestly, I&apos;m always up for exploring the city.
        </p>
        <Speaker playing={step === EXAMPLE_SCENE.sentence} />
      </div>
      <p className="mt-2 text-base text-muted-foreground">
        솔직히 난 도시 탐험이라면 언제든 콜이야.
      </p>
    </div>

    {/* 큰 래디 화면 — 예문 뒤에 「이런 느낌이에요」로 받고 뉘앙스를 한 줄로 알려준다 */}
    <div
      className={`absolute inset-0 flex flex-col items-center bg-background px-6 pt-20 transition-opacity duration-500 ${
        step === EXAMPLE_SCENE.nuance
          ? 'opacity-100'
          : 'pointer-events-none opacity-0'
      }`}
    >
      <Image
        src={RANDY.wand}
        alt=""
        width={220}
        height={220}
        className={`size-[220px] ${step === EXAMPLE_SCENE.nuance ? 'animate-pop' : ''}`}
      />
      <div
        className={`mt-5 rounded-3xl bg-card px-6 py-4 text-center shadow-[0_10px_24px_rgba(51,38,26,0.12)] ${step === EXAMPLE_SCENE.nuance ? 'animate-reveal-up' : ''}`}
        style={{ '--i': 3 } as CSSProperties}
      >
        <p className="text-base font-bold text-muted-foreground">
          이런 느낌이에요
        </p>
        <p className="mt-1 text-[22px] leading-snug font-bold text-foreground">
          &apos;콜!&apos;처럼 반갑게 답할 때 써요
        </p>
      </div>
    </div>
  </DemoScreen>
);
