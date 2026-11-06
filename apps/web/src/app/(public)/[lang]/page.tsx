// 언어별 랜딩(/ko·/ja) — 브라우저로 온 사람에게 앱 기능을 소개하고 스토어로 보낸다. 셸 안에서 열리면 그리기 전에 홈으로 넘긴다
import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { notFound } from 'next/navigation';

import { SHARE_CARD } from '@/app/(public)/download/_lib/link-preview';
import { isLocale, type Locale } from '@/shared/i18n/locale';

import { buildStructuredData } from './_model/structured-data';
import { JsonLd } from './_ui/JsonLd';
import { LandingPage } from './_ui/LandingPage';
import { ShellRedirect } from './_ui/ShellRedirect';

type Props = { params: Promise<{ lang: string }> };

const OG_LOCALE: Record<Locale, string> = { ko: 'ko_KR', ja: 'ja_JP' };

const localeOf = async (params: Props['params']) => {
  const { lang } = await params;
  if (!isLocale(lang)) notFound();
  return lang;
};

export const generateMetadata = async ({
  params,
}: Props): Promise<Metadata> => {
  const locale = await localeOf(params);
  const t = await getTranslations({ locale, namespace: 'landing.meta' });
  // 공유 카드는 앱의 친구 공유 링크와 같은 제목, 설명, 그림을 쓴다
  const card = SHARE_CARD[locale];
  const image = {
    url: card.imagePath,
    width: 1200,
    height: 630,
    alt: card.title,
  };
  return {
    title: { absolute: t('title') },
    description: t('description'),
    applicationName: t('appNameLabel'),
    category: 'education',
    // 언어별 주소를 서로 알린다 — 루트(/)는 언어를 보고 둘 중 하나로 보내는 기본 주소다
    alternates: {
      canonical: `/${locale}`,
      languages: { ko: '/ko', ja: '/ja', 'x-default': '/' },
    },
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        'max-image-preview': 'large',
        'max-snippet': -1,
      },
    },
    openGraph: {
      type: 'website',
      url: `/${locale}`,
      siteName: card.siteName,
      locale: OG_LOCALE[locale],
      alternateLocale: Object.values(OG_LOCALE).filter(
        (value) => value !== OG_LOCALE[locale],
      ),
      title: card.title,
      description: card.description,
      images: image,
    },
    twitter: {
      card: 'summary_large_image',
      title: card.title,
      description: card.description,
      images: image.url,
    },
    itunes: { appId: '6787414201' },
    // 서치 콘솔·서치어드바이저에서 받은 값을 환경변수로 넣으면 소유 확인 태그가 나간다
    verification: {
      google: process.env.GOOGLE_SITE_VERIFICATION,
      other: process.env.NAVER_SITE_VERIFICATION
        ? { 'naver-site-verification': process.env.NAVER_SITE_VERIFICATION }
        : undefined,
    },
  };
};

const LocaleLandingPage = async ({ params }: Props) => {
  const locale = await localeOf(params);
  const t = await getTranslations({ locale, namespace: 'landing' });
  return (
    <>
      <ShellRedirect />
      <JsonLd data={buildStructuredData(locale, t)} />
      <LandingPage locale={locale} />
    </>
  );
};

export default LocaleLandingPage;
