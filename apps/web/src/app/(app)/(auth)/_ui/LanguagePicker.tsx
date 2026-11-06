'use client';

// 로그인 화면 오른쪽 위 언어 버튼 — 기기 언어에 한국어·일본어가 없을 때만 보인다.
// 고르면 그 언어로 화면을 다시 그리고, 소셜 로그인이 그 언어를 맨 앞에 실어 그 언어로 가입한다
import { useRef, useState } from 'react';
import { useLocale } from 'next-intl';
import { useRouter } from 'next/navigation';

import { deviceLanguages } from '@/shared/i18n/device-languages';
import {
  hasSupportedLanguage,
  saveLocaleCookie,
  type Locale,
} from '@/shared/i18n/locale';
import { useClientOnlyValue } from '@/shared/lib/useClientOnlyValue';

import styles from './login-motion.module.css';

// 어느 언어를 읽는 사람인지 모르는 버튼이라 문구 묶음 대신 언어 이름을 그 언어로 적는다
const OPTIONS: { locale: Locale; label: string }[] = [
  { locale: 'ko', label: '한국어' },
  { locale: 'ja', label: '日本語' },
];

const GlobeIcon = () => (
  <svg
    aria-hidden="true"
    viewBox="0 0 24 24"
    className="size-4 text-muted-foreground"
    fill="none"
    stroke="currentColor"
    strokeWidth={1.8}
    strokeLinecap="round"
  >
    <circle cx="12" cy="12" r="9" />
    <path d="M3.6 9h16.8M3.6 15h16.8M11.5 3a17 17 0 0 0 0 18M12.5 3a17 17 0 0 1 0 18" />
  </svg>
);

const ChevronIcon = ({ open }: { open: boolean }) => (
  <svg
    aria-hidden="true"
    viewBox="0 0 24 24"
    className={`size-3.5 text-muted-foreground transition-transform ${open ? 'rotate-180' : ''}`}
    fill="none"
    stroke="currentColor"
    strokeWidth={2}
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M6 9l6 6 6-6" />
  </svg>
);

const CheckIcon = () => (
  <svg
    aria-hidden="true"
    viewBox="0 0 24 24"
    className="size-[18px] text-primary"
    fill="none"
    stroke="currentColor"
    strokeWidth={2.2}
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M5 12l5 5L20 7" />
  </svg>
);

export const LanguagePicker = () => {
  const current = useLocale() as Locale;
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const toggleRef = useRef<HTMLButtonElement>(null);
  // 서버 렌더·첫 렌더엔 숨긴다 — 기기 언어는 브라우저에서만 안다
  const visible = useClientOnlyValue(
    () => !hasSupportedLanguage(deviceLanguages()),
    false,
  );
  if (!visible) return null;

  const currentLabel = OPTIONS.find(
    (option) => option.locale === current,
  )?.label;

  const close = () => {
    setOpen(false);
    toggleRef.current?.focus();
  };

  const select = (locale: Locale) => {
    close();
    if (locale === current) return;
    saveLocaleCookie(locale);
    router.refresh();
  };

  return (
    <div
      onKeyDown={(event) => open && event.key === 'Escape' && close()}
      className={`${styles.picker} absolute top-[calc(var(--safe-area-inset-top)+12px)] right-5`}
    >
      {/* 읽는 사람의 언어를 모르니 이름은 영어로 둔다 */}
      <button
        ref={toggleRef}
        type="button"
        aria-label={`Language, ${currentLabel}`}
        aria-expanded={open}
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1.5 rounded-full border border-border bg-card py-[7px] pr-2.5 pl-3 text-14 font-medium text-foreground shadow-xs active:bg-muted"
      >
        <GlobeIcon />
        <span lang={current}>{currentLabel}</span>
        <ChevronIcon open={open} />
      </button>
      {open && (
        <>
          {/* 바깥을 누르면 닫는다 */}
          <div
            aria-hidden="true"
            data-testid="language-picker-backdrop"
            className="fixed inset-0"
            onClick={close}
          />
          <ul className="absolute top-full right-0 mt-2 w-40 rounded-2xl border border-border bg-card p-1.5 shadow-[0_8px_24px_rgb(0_0_0/0.1)]">
            {OPTIONS.map(({ locale, label }) => (
              <li key={locale}>
                <button
                  type="button"
                  aria-pressed={locale === current}
                  lang={locale}
                  onClick={() => select(locale)}
                  className="flex w-full items-center justify-between rounded-[10px] py-[11px] pr-2.5 pl-3 text-15 text-foreground aria-pressed:bg-muted aria-pressed:font-medium"
                >
                  {label}
                  {locale === current && <CheckIcon />}
                </button>
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
};
