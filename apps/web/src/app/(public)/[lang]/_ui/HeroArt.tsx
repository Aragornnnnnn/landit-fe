// 첫 화면 그림 — 폰 앞의 네 친구 위로, 폰 화면 안에 내가 한 말과 상대의 속마음을 띄운다. 속마음은 내 영어가 통했을 때의 기분 좋은 반응을 보여 준다. 주황은 다운로드 버튼에만 써서 시선을 모으고, 말풍선은 짙은 색·흰색으로 둔다. 휴대폰은 세로형(1080×1440), 태블릿 이상은 정사각형 그림을 쓴다 — 폰과 캐릭터는 같은 캔버스의 투명 그림 두 장이라 그대로 겹치고 캐릭터만 솟아오르게 한다. 폰 화면이 투명해서 뒤에 흰 화면을 깔고, 그림 아래는 폰 아래 테두리 위(세로형 y 1245, 화면 모서리가 굽기 전, 정사각형은 인물 발끝 위)에서 카드 경계에 잘린다
import { getTranslations } from 'next-intl/server';
import { getImageProps } from 'next/image';
import { preload } from 'react-dom';

import type { Locale } from '@/shared/i18n/locale';

import styles from './landing.module.css';

type Part = 'phone' | 'characters';

const MOBILE_MEDIA = '(max-width: 639px)';
const DESKTOP_MEDIA = '(min-width: 640px)';

/** 한 장(폰 또는 캐릭터)의 휴대폰·태블릿 이상 그림을 만들고, 화면 폭에 맞는 것만 먼저 받도록 media를 나눠 preload한다 */
const heroPart = (part: Part, alt: string) => {
  // 첫 화면 가장 큰 그림(LCP)이라 먼저 받는다
  const common = { alt, loading: 'eager', fetchPriority: 'high' } as const;
  const { props: mobile } = getImageProps({
    ...common,
    src: `/images/landing/hero-mobile-${part}.webp`,
    width: 810,
    height: 1080,
    sizes: '100vw',
  });
  const { props: desktop } = getImageProps({
    ...common,
    src: `/images/landing/hero-desktop-${part}.webp`,
    width: 1200,
    height: 1200,
    sizes: '560px',
  });
  preload(mobile.src, {
    as: 'image',
    imageSrcSet: mobile.srcSet,
    imageSizes: '100vw',
    media: MOBILE_MEDIA,
    fetchPriority: 'high',
  });
  preload(desktop.src, {
    as: 'image',
    imageSrcSet: desktop.srcSet,
    imageSizes: '560px',
    media: DESKTOP_MEDIA,
    fetchPriority: 'high',
  });
  return { mobile, desktop };
};

const HeroPicture = ({
  part,
  className,
}: {
  part: ReturnType<typeof heroPart>;
  className: string;
}) => (
  <picture>
    <source media={MOBILE_MEDIA} srcSet={part.mobile.srcSet} sizes="100vw" />
    {/* eslint-disable-next-line jsx-a11y/alt-text -- alt는 getImageProps가 넣는다 */}
    <img
      {...part.desktop}
      className={`aspect-[3/4] h-auto w-full sm:aspect-square ${className}`}
    />
  </picture>
);

export const HeroArt = async ({ locale }: { locale: Locale }) => {
  const t = await getTranslations({ locale, namespace: 'landing.hero' });
  // 그림 설명은 캐릭터 한 장에만 단다 — 폰은 꾸밈이라 화면 낭독기가 두 번 읽지 않게
  const phone = heroPart('phone', '');
  const characters = heroPart('characters', t('artLabel'));
  return (
    <div className="relative mx-auto mt-8 -mb-[18%] w-full max-w-[560px] self-end sm:-mb-[9.8%] lg:mt-6">
      {/* 말풍선은 휴대폰에서 폰 화면 안쪽 가장자리로부터 화면 폭의 약 8%씩 띄운다 — 테두리에 붙어 보이지 않게 */}
      {/* 폰 화면 자리 — 세로형은 x 253~826, y 140~1328(1080×1440), 정사각형은 x 549~1495, y 187부터(2048) */}
      <div className="absolute top-[9.7%] left-[23.4%] h-[82.5%] w-[53.1%] rounded-[12%/5.5%] bg-white sm:top-[9.1%] sm:left-[26.8%] sm:h-[82%] sm:w-[46.2%] sm:rounded-[12%/6.5%]" />
      <HeroPicture part={phone} className="relative" />
      <HeroPicture
        part={characters}
        className={`absolute inset-0 ${styles.castRise}`}
      />
      <p className="absolute top-[17.5%] right-[27.5%] rounded-[10px] rounded-br-[4px] bg-[#fde3cf] px-2.5 py-1 text-[12px] font-semibold whitespace-nowrap text-[#2b2522] sm:top-[17%] sm:right-[29.5%] sm:px-3 sm:py-1.5 sm:text-[14px]">
        You made my day!
      </p>
      <div className="absolute top-[24.8%] left-[27.5%] w-[40%] rounded-[14px] rounded-bl-[4px] bg-white px-2.5 py-1.5 shadow-[0_6px_16px_rgba(90,50,20,0.14)] sm:top-[25%] sm:left-[29%] sm:w-[35%] sm:px-3 sm:py-2.5">
        <p className="text-[10px] font-bold text-[#a34a12] sm:text-[11px]">
          {t('thoughtLabel')}
        </p>
        <p className="mt-0.5 text-[12px] leading-snug font-bold break-keep text-[#1f1a17] sm:text-[14px]">
          {t('thoughtBody')}
        </p>
      </div>
    </div>
  );
};
