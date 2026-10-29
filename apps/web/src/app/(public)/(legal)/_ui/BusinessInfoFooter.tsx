'use client';

// 전자상거래법 10조가 요구하는 사업자 정보 표시 — 약관·처리방침 페이지 하단에 접힌 채 붙고, 누르면 펼쳐진다 (모바일 순차 표시 예외)
import { useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';

import type { Locale } from '@/shared/i18n/locale';

export type BusinessInfo = {
  name: string;
  representative: string;
  registrationNumber: string;
  address: string;
  email: string;
  hosting: string;
  // 아래 둘은 확보 전이라 null이면 줄을 숨긴다
  phone: string | null;
  mailOrderNumber: string | null;
};

export const BUSINESS_INFO: BusinessInfo = {
  name: '랜딧(Landit)',
  representative: '손예원',
  registrationNumber: '284-24-02238',
  address: '충청북도 청주시 상당구 무농정로 6, 1층 S25호',
  email: 'landitkorea@gmail.com',
  hosting: 'Vercel Inc.',
  phone: '0507-1396-7809',
  mailOrderNumber: null,
};

// 일본어 화면용 — 상호·대표자·주소만 일본어 화면에서 읽히는 표기로 바꾸고 나머지는 같다
const BUSINESS_INFO_JA: BusinessInfo = {
  ...BUSINESS_INFO,
  name: 'Landit',
  representative: 'Son Yewon',
  address:
    '1F S25, 6 Munongjeong-ro, Sangdang-gu, Cheongju-si, Chungcheongbuk-do, Republic of Korea',
};

const BUSINESS_INFO_BY_LOCALE: Record<Locale, BusinessInfo> = {
  ko: BUSINESS_INFO,
  ja: BUSINESS_INFO_JA,
};

interface BusinessInfoFooterProps {
  info?: BusinessInfo;
}

const ChevronDownIcon = ({ open }: { open: boolean }) => (
  <svg
    width="14"
    height="14"
    viewBox="0 0 24 24"
    fill="none"
    aria-hidden="true"
    className={`transition-transform ${open ? 'rotate-180' : ''}`}
  >
    <path
      d="M6 9l6 6 6-6"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

export const BusinessInfoFooter = ({ info }: BusinessInfoFooterProps) => {
  const t = useTranslations('legal.businessInfo');
  const locale = useLocale();
  const businessInfo = info ?? BUSINESS_INFO_BY_LOCALE[locale];
  const [open, setOpen] = useState(false);

  const rows: Array<[string, string | null]> = [
    [t('nameLabel'), businessInfo.name],
    [t('representativeLabel'), businessInfo.representative],
    [t('registrationNumberLabel'), businessInfo.registrationNumber],
    [t('mailOrderNumberLabel'), businessInfo.mailOrderNumber],
    [t('addressLabel'), businessInfo.address],
    [t('phoneLabel'), businessInfo.phone],
    [t('emailLabel'), businessInfo.email],
    [t('hostingLabel'), businessInfo.hosting],
  ];

  return (
    <footer className="mt-6 px-1">
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        aria-expanded={open}
        className="flex items-center gap-1 py-1 text-xs font-semibold text-muted-foreground"
      >
        {t('toggleButton')}
        <ChevronDownIcon open={open} />
      </button>
      {open && (
        <dl className="mt-1 space-y-1">
          {rows.map(([label, value]) =>
            value === null ? null : (
              <div key={label} className="flex gap-3 text-xs leading-5">
                <dt className="w-[104px] shrink-0 text-muted-foreground">
                  {label}
                </dt>
                <dd className="text-foreground">{value}</dd>
              </div>
            ),
          )}
        </dl>
      )}
    </footer>
  );
};
