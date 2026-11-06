// 업데이트 기록(/ko/updates·/ja/updates) — 랜딧이 어떻게 달라지고 있는지 날짜순으로 보여 주는 공개 화면. 일본어 판은 문구를 일본어로 쓰고 일본어로 다시 만든 그림이 있으면 그것을 쓴다
import type { Metadata, Viewport } from 'next';
import Image from 'next/image';
import { notFound } from 'next/navigation';

import { isLocale, type Locale } from '@/shared/i18n/locale';

import { buildUpdatesStructuredData } from '../_model/structured-data';
import { JsonLd } from '../_ui/JsonLd';
import { LandingFooter } from '../_ui/LandingFooter';
import { LandingHeader } from '../_ui/LandingHeader';
import { QrCard } from '../_ui/QrCard';
import { updateEntries } from './_ui/updates-content';

type Props = { params: Promise<{ lang: string }> };

const COPY: Record<
  Locale,
  {
    title: string;
    description: string;
    siteName: string;
    imageAlt: (title: string) => string;
  }
> = {
  ko: {
    title: '랜딧 업데이트 기록',
    description: '랜딧의 새 기능과 달라진 점을 날짜순으로 정리했어요.',
    siteName: '랜딧',
    imageAlt: (title) => `${title} 화면`,
  },
  ja: {
    title: 'Landit アップデート履歴',
    description: 'Landitの新機能や変更点を日付順にまとめました。',
    siteName: 'Landit',
    imageAlt: (title) => `${title}の画面`,
  },
};

const localeOf = async (params: Props['params']) => {
  const { lang } = await params;
  if (!isLocale(lang)) notFound();
  return lang;
};

export const generateMetadata = async ({
  params,
}: Props): Promise<Metadata> => {
  const locale = await localeOf(params);
  const { title, description, siteName } = COPY[locale];
  return {
    title: { absolute: title },
    description,
    alternates: {
      canonical: `/${locale}/updates`,
      languages: { ko: '/ko/updates', ja: '/ja/updates' },
    },
    openGraph: {
      type: 'website',
      url: `/${locale}/updates`,
      siteName,
      title,
      description,
      images: { url: '/og/share.jpg', width: 1200, height: 630 },
    },
    twitter: { card: 'summary_large_image', images: '/og/share.jpg' },
  };
};

export const viewport: Viewport = { maximumScale: 5, userScalable: true };

const UpdatesPage = async ({ params }: Props) => {
  const locale = await localeOf(params);
  const { title: pageTitle, description, imageAlt } = COPY[locale];
  const entries = updateEntries(locale);
  return (
    <div className="min-h-svh bg-card text-foreground">
      <JsonLd data={buildUpdatesStructuredData(locale, entries)} />
      <LandingHeader locale={locale} />
      <main className="mx-auto max-w-[800px] px-5 pt-10 pb-10 sm:px-6 sm:pt-16">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h1 className="text-[32px] leading-[1.25] font-black tracking-[-0.03em] break-keep sm:text-[44px]">
              {pageTitle}
            </h1>
            <p className="mt-3 text-[16px] font-medium break-keep text-muted-foreground sm:text-[17px]">
              {description}
            </p>
          </div>
          <Image
            src="/images/paywall/randy-wand.webp"
            alt=""
            width={112}
            height={112}
            className="size-20 shrink-0 sm:size-28"
          />
        </div>
        <ol className="mt-10 sm:mt-14">
          {entries.map(
            ({ date, displayDate, title, body, image, tint }, index) => (
              <li
                key={date}
                className="grid gap-3 border-t border-border py-8 first:border-t-0 first:pt-0 sm:grid-cols-[180px_minmax(0,1fr)] sm:gap-6 sm:py-10"
              >
                <time
                  dateTime={date}
                  className="text-[15px] text-muted-foreground tabular-nums sm:pt-1.5"
                >
                  {displayDate}
                </time>
                <div>
                  <h2 className="text-[23px] leading-[1.35] font-extrabold tracking-[-0.02em] break-keep sm:text-[26px]">
                    {title}
                  </h2>
                  <p className="mt-2 text-[16px] leading-relaxed break-keep text-muted-foreground">
                    {body}
                  </p>
                  <div
                    className="mt-4 aspect-[4/3] overflow-hidden rounded-[20px]"
                    style={{ backgroundColor: tint }}
                  >
                    <Image
                      src={image}
                      alt={imageAlt(title)}
                      width={1200}
                      height={900}
                      sizes="(min-width: 640px) 560px, 100vw"
                      // 맨 위 기록 그림이 첫 화면의 가장 큰 그림이라 먼저 받는다 — 나머지는 스크롤할 때 받는다
                      preload={index === 0}
                      className="size-full"
                    />
                  </div>
                </div>
              </li>
            ),
          )}
        </ol>
      </main>
      <LandingFooter locale={locale} />
      <QrCard locale={locale} />
    </div>
  );
};

export default UpdatesPage;
