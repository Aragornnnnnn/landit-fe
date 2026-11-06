// 랜딩·업데이트 기록 공통 머리 — 넓은 화면에선 로고가 첫 화면 제목과 같은 선에서 시작한다. 왼쪽 로고는 그 언어의 랜딩으로, 오른쪽은 업데이트 기록으로 간다. 업데이트 기록은 그 언어 판으로 간다
import { getTranslations } from 'next-intl/server';
import Image from 'next/image';
import Link from 'next/link';

import type { Locale } from '@/shared/i18n/locale';

export const LandingHeader = async ({ locale }: { locale: Locale }) => {
  const t = await getTranslations({ locale, namespace: 'landing.header' });
  return (
    <header className="sticky top-0 z-30 bg-card/85 backdrop-blur-md">
      <div className="mx-auto flex h-12 max-w-[1180px] items-center justify-between px-5 sm:h-14 sm:px-6 lg:px-14">
        <Link href={`/${locale}`} aria-label={t('homeLabel')}>
          <Image
            src="/brand/landit-logo.svg"
            alt={t('logoLabel')}
            width={78}
            height={24}
            priority
          />
        </Link>
        <Link
          href={`/${locale}/updates`}
          className="text-[15px] font-semibold text-foreground hover:opacity-70"
        >
          {t('updatesLink')}
        </Link>
      </div>
    </header>
  );
};
