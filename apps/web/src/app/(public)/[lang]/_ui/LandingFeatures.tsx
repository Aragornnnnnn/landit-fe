// 기능 설명 — 속마음·맞춤 표현(발음 포함)·자유 대화(스몰톡·롤플레이) 셋을 짧은 글자와 큰 폰 한 대로 보여 준다. 폰 화면은 전부 실제 앱 캡처다
import type { CSSProperties } from 'react';
import { getTranslations } from 'next-intl/server';
import Image from 'next/image';

import type { Locale } from '@/shared/i18n/locale';
import { RevealSection } from '@/shared/ui/RevealSection';

import { SCREEN_IMAGE, screenPath } from '../_model/screen-image';
import { ScreenSwap } from './ScreenSwap';
import { titleTags } from './title-tags';
import type { Mark } from './Underline';

/** 기능 순서와 강조 모양·폰 화면 — 문구는 landing.features의 `{주제}Title`·`{주제}Body`·`{주제}ScreenLabel` */
type Topic = 'thought' | 'expression' | 'freeTalk';

const FEATURES: {
  topic: Topic;
  mark: Mark;
  shot: string;
  /** 스크롤하면 넘어가는 다음 화면과 그 설명 키 */
  next?: {
    shot: string;
    labelKey:
      'expressionPronunciationScreenLabel' | 'freeTalkSmallTalkScreenLabel';
  };
}[] = [
  { topic: 'thought', mark: 'brush', shot: 'thought-bad' },
  // 표현 설명을 보여 주다가 스크롤하면 발음 결과로 넘어간다 — 제목의 "발음까지"를 화면으로 보여 준다
  {
    topic: 'expression',
    mark: 'double',
    shot: 'expression-explain',
    next: {
      shot: 'expression-pron',
      labelKey: 'expressionPronunciationScreenLabel',
    },
  },
  // 롤플레이 목록을 보여 주다가 스크롤하면 스몰톡 화면으로 넘어간다
  {
    topic: 'freeTalk',
    mark: 'circle',
    shot: 'roleplay-list',
    next: {
      shot: 'smalltalk-friend',
      labelKey: 'freeTalkSmallTalkScreenLabel',
    },
  },
];

export const LandingFeatures = async ({ locale }: { locale: Locale }) => {
  const t = await getTranslations({ locale, namespace: 'landing.features' });
  return (
    <section className="mx-auto flex max-w-[1080px] flex-col gap-20 px-3 pt-24 sm:px-6 sm:pt-32 lg:gap-28">
      {/* else의 "Why Else?"처럼 기능 셋을 묶는 짧은 제목 — 바로 아래 기능 제목에 밑줄이 있어 여기엔 강조를 두지 않는다. 기능 제목은 그 아래 단계(h3)다 */}
      <RevealSection>
        <h2 className="px-3 text-center text-[34px] leading-[1.35] font-bold break-keep sm:text-[48px]">
          {t('title')}
        </h2>
      </RevealSection>
      {FEATURES.map(({ topic, mark, shot, next }, index) => (
        <RevealSection
          key={topic}
          className="grid grid-cols-[minmax(0,1fr)] items-center gap-8 lg:grid-cols-2 lg:gap-14"
        >
          <div
            className={`px-3 text-center lg:px-6 lg:text-left ${index % 2 ? 'lg:order-2' : ''}`}
          >
            <h3 className="reveal-up text-[32px] leading-[1.4] font-bold break-keep sm:text-[44px]">
              {t.rich(`${topic}Title`, titleTags(mark))}
            </h3>
            <p
              className="reveal-up mt-4 text-[18px] leading-[1.7] break-keep text-[#57524c] sm:text-[20px]"
              style={{ '--i': 1 } as CSSProperties}
            >
              {t(`${topic}Body`)}
            </p>
          </div>
          {/* 폰 아래는 판에서 잘린다. 화면 캡처는 프레임 그림의 투명한 화면 자리에 맞춰 깔고, 프레임을 위에 얹는다 */}
          <div
            data-phone-stage
            className="relative h-[480px] overflow-hidden rounded-[32px] bg-[#f5f5f3] sm:h-[560px] lg:rounded-[40px]"
          >
            <div className="absolute top-10 left-1/2 aspect-[1046/1766] w-[322px] -translate-x-1/2 sm:top-12 sm:w-[366px]">
              {/* 화면 자리 — 1046×1766 프레임에서 x 52~994, y 45~1718, 모서리 반경 약 92px */}
              <div className="absolute top-[2.55%] left-[4.97%] h-[94.73%] w-[90.06%] overflow-hidden rounded-[9.8%/5.5%] bg-white">
                {next ? (
                  <ScreenSwap
                    first={{
                      src: screenPath(locale, shot),
                      alt: t(`${topic}ScreenLabel`),
                    }}
                    next={{
                      src: screenPath(locale, next.shot),
                      alt: t(next.labelKey),
                    }}
                  />
                ) : (
                  <Image
                    src={screenPath(locale, shot)}
                    alt={t(`${topic}ScreenLabel`)}
                    {...SCREEN_IMAGE}
                    className="w-full"
                  />
                )}
              </div>
              <Image
                src="/images/landing/iphone-frame.webp"
                alt=""
                width={1046}
                height={1766}
                sizes="(min-width: 640px) 366px, 322px"
                quality={90}
                className="pointer-events-none absolute inset-0 size-full"
              />
            </div>
          </div>
        </RevealSection>
      ))}
    </section>
  );
};
