// 랜딩 화면 조립 — 첫 화면 → 오늘의 시나리오 벽 → 기능 셋 → 다른 점 → 리뷰(한국어만) → 시작하기 → 질문 → 바닥글
import { getTranslations } from 'next-intl/server';
import Image from 'next/image';

import type { Locale } from '@/shared/i18n/locale';
import { RevealSection } from '@/shared/ui/RevealSection';

import { buildLandingFaq } from '../_model/landing-faq';
import { FaqItem } from './FaqItem';
import { HeroArt } from './HeroArt';
import { HeroBadges } from './HeroBadges';
import { LandingChange } from './LandingChange';
import { LandingFeatures } from './LandingFeatures';
import { LandingFooter } from './LandingFooter';
import { LandingHeader } from './LandingHeader';
import { LandingReviews } from './LandingReviews';
import { LandingWall } from './LandingWall';
import { QrCard } from './QrCard';
import { StoreButtons } from './StoreButtons';
import { titleTags } from './title-tags';

export const LandingPage = async ({ locale }: { locale: Locale }) => {
  const t = await getTranslations({ locale, namespace: 'landing' });
  return (
    <div className="bg-card text-foreground">
      <LandingHeader locale={locale} />

      <main>
        <section data-inview="true" className="px-3 pt-2 sm:px-6 lg:pt-6">
          <div className="mx-auto grid max-w-[1180px] grid-cols-[minmax(0,1fr)] overflow-hidden rounded-[32px] bg-[#f5f5f3] lg:grid-cols-[minmax(0,1fr)_minmax(0,560px)] lg:rounded-[40px]">
            <div className="px-6 pt-10 text-center sm:px-10 lg:flex lg:flex-col lg:py-16 lg:pl-14 lg:text-left">
              {/* else처럼 제목 위에 앱 아이콘과 이름을 먼저 보여 준다 — 이름은 검색엔진도 읽는 글자로 둔다. 휴대폰은 머리글 로고와 겹쳐 숨긴다 */}
              <p className="mb-6 hidden items-center gap-3 text-[28px] font-extrabold sm:flex sm:justify-center lg:justify-start">
                <Image
                  src="/images/landing/app-icon.webp"
                  alt=""
                  width={240}
                  height={240}
                  className="size-12 rounded-[22.5%] shadow-[0_6px_16px_rgba(90,50,20,0.18)] sm:size-14"
                />
                {t('hero.brandLabel')}
              </p>
              <h1 className="text-[38px] leading-[1.35] font-extrabold break-keep sm:text-[52px] lg:text-[56px]">
                {t.rich('hero.title', titleTags())}
              </h1>
              <div className="mt-7 sm:mt-9">
                <HeroBadges locale={locale} />
              </div>
              {/* 컴퓨터에선 else처럼 스토어 배지를 카드 아래쪽에 붙인다 */}
              <div className="mt-6 sm:mt-8 lg:mt-auto lg:pt-10">
                <StoreButtons
                  locale={locale}
                  placement="hero"
                  className="sm:flex sm:justify-center lg:justify-start"
                />
              </div>
            </div>
            <HeroArt locale={locale} />
          </div>
        </section>

        <RevealSection className="mt-12 bg-[#f5f5f3] pt-14 text-center sm:mt-32 sm:pt-20">
          <h2 className="px-6 text-[30px] leading-[1.35] font-extrabold break-keep sm:text-[40px]">
            {t.rich('wall.title', titleTags('circle'))}
          </h2>
          <p className="mt-3 px-6 text-17 break-keep text-[#57524c]">
            {t('wall.body')}
          </p>
          <div className="mt-6">
            <LandingWall todayLabel={t('wall.todayLabel')} />
          </div>
        </RevealSection>
        <LandingFeatures locale={locale} />

        <LandingChange locale={locale} />

        {/* 한국 스토어 리뷰라 한국어 화면에만 둔다 */}
        {locale === 'ko' && (
          <div className="mt-20 sm:mt-28">
            <LandingReviews />
          </div>
        )}

        <RevealSection className="px-6 pt-4 text-center sm:pt-8">
          <Image
            src="/images/character/landy-wave-smile.webp"
            alt={t('closing.mascotLabel')}
            width={480}
            height={601}
            className="animate-float mx-auto h-[150px] w-auto sm:h-[180px]"
          />
          <h2 className="mt-4 text-[30px] leading-[1.4] font-extrabold break-keep sm:text-[40px]">
            {t.rich('closing.title', titleTags())}
          </h2>
          <StoreButtons
            locale={locale}
            placement="closing"
            className="mx-auto mt-8 max-w-[440px] sm:flex sm:justify-center"
          />
        </RevealSection>

        <section className="mx-auto max-w-[760px] px-6 pt-24 pb-20 sm:pt-32 sm:pb-28">
          <h2 className="text-[30px] leading-[1.35] font-extrabold sm:text-[36px]">
            {t('faq.title')}
          </h2>
          <div className="mt-5 border-t border-border">
            {buildLandingFaq(t).map(({ question, answer }) => (
              <FaqItem key={question} question={question} answer={answer} />
            ))}
          </div>
        </section>
      </main>

      <LandingFooter locale={locale} />
      <QrCard locale={locale} />
    </div>
  );
};
