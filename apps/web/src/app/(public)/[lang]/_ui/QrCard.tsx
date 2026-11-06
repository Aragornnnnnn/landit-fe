// 오른쪽 아래 QR 카드 — 컴퓨터로 보는 사람이 휴대폰 카메라로 찍어 바로 앱을 받게 한다. 화면 아래에 붙어 따라다니고, 휴대폰·태블릿에선 숨긴다
import { getTranslations } from 'next-intl/server';
import Image from 'next/image';

import type { Locale } from '@/shared/i18n/locale';

export const QrCard = async ({ locale }: { locale: Locale }) => {
  const t = await getTranslations({ locale, namespace: 'landing.qrCard' });
  return (
    <aside className="fixed right-16 bottom-0 z-40 hidden w-[136px] flex-col items-center rounded-t-3xl bg-white px-3.5 pt-3.5 pb-3 shadow-[0_-4px_14px_rgba(0,0,0,0.1)] lg:flex">
      {/* QR은 /download로 가고, 그 주소가 기기를 보고 맞는 스토어로 보낸다 */}
      <div className="relative size-[112px]">
        <Image
          src="/images/landing/download-qr-v3.svg"
          alt={t('qrLabel')}
          width={112}
          height={112}
          unoptimized
          className="size-full"
        />
        <Image
          src="/brand/icon-192.png"
          alt=""
          width={20}
          height={20}
          className="absolute top-1/2 left-1/2 size-5 -translate-x-1/2 -translate-y-1/2 rounded-[5px]"
        />
      </div>
      <p className="mt-2 text-[13px] font-bold whitespace-nowrap text-accent">
        {t('downloadCaption')}
      </p>
    </aside>
  );
};
