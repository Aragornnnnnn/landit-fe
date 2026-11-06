// 스토어 버튼 — 태블릿 이상은 애플·구글 플레이 실제 로고의 검은 배지 둘, 모바일은 기기에 맞춰 보내는 다운로드 버튼 하나. 배지 글자는 두 스토어의 영어 배지 표기 그대로다. 모두 /download를 거쳐 랜딩 유입으로 기록된다
import { getTranslations } from 'next-intl/server';

import type { Locale } from '@/shared/i18n/locale';
import { AppleIcon } from '@/shared/ui/SocialIcons';

// 구글 플레이 프리즘 — 네 조각의 규정 색이라 토큰으로 만들지 않는다
const GooglePlayIcon = () => (
  <svg viewBox="0 0 24 26" aria-hidden="true">
    <path
      d="M1.34 1.42c-.07.17-.11.36-.11.57v21.02c0 .22.05.42.13.6l11.15-11.09L1.34 1.42Z"
      fill="#00C3FF"
    />
    <path
      d="M13.54 11.49 16.8 8.25 3.45.7a1.47 1.47 0 0 0-.95-.18l11.04 10.97Z"
      fill="#00E676"
    />
    <path
      d="m22.02 13.8-3.92 2.22-3.52-3.5 3.55-3.52 3.89 2.2a1.49 1.49 0 0 1 0 2.6Z"
      fill="#FFC400"
    />
    <path
      d="m13.54 13.56-11 10.93c.3.04.61-.02.9-.18l13.33-7.54-3.23-3.21Z"
      fill="#FF3D57"
    />
  </svg>
);

const DownloadIcon = () => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.2"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
    className="size-[22px]"
  >
    <path d="M12 3.5v11m-4.5-4.5 4.5 4.5 4.5-4.5M4.5 15v2.5a2 2 0 0 0 2 2h11a2 2 0 0 0 2-2V15" />
  </svg>
);

/** 랜딩에서 누른 다운로드는 모두 /download를 거쳐 기록된다. 모바일 버튼은 기기로, 배지는 store로 스토어를 고른다 */
const LANDING_DOWNLOAD_PATH =
  '/download?utm_source=landing&utm_medium=web&utm_campaign=landing_cta';

const STORES = [
  {
    href: `${LANDING_DOWNLOAD_PATH}&store=app_store`,
    icon: <AppleIcon size={26} />,
    caption: 'Download on the',
    name: 'App Store',
    labelKey: 'appStoreLabel',
  },
  {
    href: `${LANDING_DOWNLOAD_PATH}&store=play_store`,
    icon: <GooglePlayIcon />,
    caption: 'GET IT ON',
    name: 'Google Play',
    labelKey: 'googlePlayLabel',
  },
] as const;

export const StoreButtons = async ({
  locale,
  className = '',
}: {
  locale: Locale;
  className?: string;
}) => {
  const t = await getTranslations({
    locale,
    namespace: 'landing.storeButtons',
  });
  return (
    <div className={className}>
      {/* 흰 글자 대비 — 기본 주황(#e07a3a)은 2.99:1로 큰 글자 기준(3:1)에 못 미쳐, 눈으로 구분되지 않을 만큼(2%) 짙게 하고 19px 굵게 둔다 */}
      <a
        href={LANDING_DOWNLOAD_PATH}
        className="mx-auto flex h-[54px] w-fit items-center gap-2 rounded-2xl bg-[#dc7839] pr-7 pl-6 text-[19px] font-bold tracking-[-0.01em] text-white transition-transform active:scale-[0.97] sm:hidden"
      >
        <DownloadIcon />
        {t('downloadButton')}
      </a>
      <div className="hidden gap-3 sm:flex sm:flex-wrap">
        {STORES.map(({ href, icon, caption, name, labelKey }) => (
          <a
            key={name}
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            className="flex h-[60px] items-center justify-center gap-3 rounded-2xl bg-black px-6 text-white transition-[translate,box-shadow] duration-200 hover:-translate-y-0.5 hover:shadow-[0_10px_22px_rgba(0,0,0,0.22)] active:translate-y-0"
          >
            <span className="size-[26px] shrink-0 [&>svg]:size-full">
              {icon}
            </span>
            <span className="flex flex-col text-left whitespace-nowrap">
              <span className="text-[11px] leading-none font-normal text-white/80">
                {caption}
              </span>
              <span className="mt-1 text-[18px] leading-none font-semibold">
                {name}
              </span>
            </span>
            {/* 읽히는 이름에 보이는 글자(Download on the App Store)가 그대로 들어가야 음성 입력으로도 누를 수 있다 — 설명은 뒤에 덧붙인다 */}
            <span className="sr-only">{t(labelKey)}</span>
          </a>
        ))}
      </div>
    </div>
  );
};
