// 바닥글 언어 바꾸기 — 지원 언어 랜딩으로 가는 평범한 링크라 스크립트 없이 동작하고 검색엔진도 따라간다
import { LOCALES, type Locale } from '@/shared/i18n/locale';

const NAMES: Record<Locale, string> = { ko: '한국어', ja: '日本語' };

export const LanguageLinks = ({
  locale,
  label,
}: {
  locale: Locale;
  label: string;
}) => (
  <nav
    aria-label={label}
    className="flex shrink-0 rounded-full border border-border p-1 text-[13px]"
  >
    {LOCALES.map((option) => (
      // 언어를 바꾸면 html lang까지 바뀌어야 해서 문서를 새로 받는 a를 쓴다
      <a
        key={option}
        href={`/${option}`}
        hrefLang={option}
        lang={option}
        aria-current={option === locale ? 'page' : undefined}
        className={`rounded-full px-3 py-1.5 ${option === locale ? 'bg-foreground font-semibold text-background' : 'text-foreground hover:opacity-70'}`}
      >
        {NAMES[option]}
      </a>
    ))}
  </nav>
);
