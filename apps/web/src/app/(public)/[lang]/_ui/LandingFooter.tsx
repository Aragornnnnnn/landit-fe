// 랜딩·업데이트 기록 공통 바닥글 — 왼쪽에 회사 표기와 약관 링크, 오른쪽에 언어 바꾸기
import { getTranslations } from 'next-intl/server';
import Link from 'next/link';

import type { Locale } from '@/shared/i18n/locale';

import { LanguageLinks } from './LanguageLinks';

export const LandingFooter = async ({ locale }: { locale: Locale }) => {
  const t = await getTranslations({ locale, namespace: 'landing.footer' });
  return (
    <footer className="bg-card">
      {/* 휴대폰은 회사 표기·약관 아래에 언어 바꾸기를 쌓고, 컴퓨터에선 오른쪽 아래 QR 카드 자리를 비워 둔다 */}
      <div className="mx-auto flex max-w-[1080px] flex-col items-start gap-5 px-6 pt-4 pb-12 min-[1440px]:pr-44 sm:flex-row sm:items-start sm:justify-between sm:gap-6">
        <div>
          <p className="text-[16px] font-medium text-[#666]">
            © Landit Inc. 2026
          </p>
          <nav
            aria-label={t('termsLabel')}
            className="mt-2 flex gap-4 text-[14px] font-medium whitespace-nowrap text-[#333]"
          >
            {/* 웹에서 열리는 약관은 랜딩과 같은 모양의 웹 문서다 — 앱 안 화면(/privacy·/terms)은 앱에서만 쓴다 */}
            <Link
              href={`/${locale}/privacy`}
              className="underline underline-offset-2 hover:opacity-70"
            >
              {t('privacyLink')}
            </Link>
            <Link
              href={`/${locale}/terms`}
              className="underline underline-offset-2 hover:opacity-70"
            >
              {t('termsLink')}
            </Link>
          </nav>
        </div>
        <LanguageLinks locale={locale} label={t('languageLabel')} />
      </div>
    </footer>
  );
};
