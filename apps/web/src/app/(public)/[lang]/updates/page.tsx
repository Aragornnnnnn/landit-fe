// 업데이트 기록(/ko/updates) — 랜딧이 어떻게 달라지고 있는지 날짜순으로 보여 주는 공개 화면. 그림 속 앱 화면이 한국어이고 일본 출시 전 기록이 대부분이라 한국어로만 둔다(/ja/updates는 404)
import type { Metadata, Viewport } from 'next';
import Image from 'next/image';
import { notFound } from 'next/navigation';

import {
  buildUpdatesStructuredData,
  toIsoDate,
} from '../_model/structured-data';
import { JsonLd } from '../_ui/JsonLd';
import { LandingFooter } from '../_ui/LandingFooter';
import { LandingHeader } from '../_ui/LandingHeader';
import { QrCard } from '../_ui/QrCard';
import { UPDATES } from './_ui/updates-content';

const TITLE = '랜딧 업데이트 기록';
const DESCRIPTION = '랜딧이 어떻게 달라지고 있는지 확인할 수 있어요.';

export const metadata: Metadata = {
  title: { absolute: TITLE },
  description: DESCRIPTION,
  alternates: { canonical: '/ko/updates' },
  openGraph: {
    type: 'website',
    url: '/ko/updates',
    siteName: '랜딧',
    title: TITLE,
    description: DESCRIPTION,
    images: { url: '/og/share.jpg', width: 1200, height: 630 },
  },
  twitter: { card: 'summary_large_image', images: '/og/share.jpg' },
};

export const viewport: Viewport = { maximumScale: 5, userScalable: true };

const UpdatesPage = async ({
  params,
}: {
  params: Promise<{ lang: string }>;
}) => {
  if ((await params).lang !== 'ko') notFound();
  return (
    <div className="min-h-svh bg-card text-foreground">
      <JsonLd data={buildUpdatesStructuredData(UPDATES)} />
      <LandingHeader locale="ko" />
      <main className="mx-auto max-w-[800px] px-5 pt-10 pb-10 sm:px-6 sm:pt-16">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h1 className="text-[32px] leading-[1.25] font-black tracking-[-0.03em] sm:text-[44px]">
              {TITLE}
            </h1>
            <p className="mt-3 text-[16px] font-medium break-keep text-muted-foreground sm:text-[17px]">
              {DESCRIPTION}
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
          {UPDATES.map(({ date, title, body, image, tint }, index) => (
            <li
              key={title}
              className="grid gap-3 border-t border-border py-8 first:border-t-0 first:pt-0 sm:grid-cols-[180px_minmax(0,1fr)] sm:gap-6 sm:py-10"
            >
              <time
                dateTime={toIsoDate(date)}
                className="text-[15px] text-muted-foreground tabular-nums sm:pt-1.5"
              >
                {date}
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
                    alt={`${title} 화면`}
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
          ))}
        </ol>
      </main>
      <LandingFooter locale="ko" />
      <QrCard locale="ko" />
    </div>
  );
};

export default UpdatesPage;
