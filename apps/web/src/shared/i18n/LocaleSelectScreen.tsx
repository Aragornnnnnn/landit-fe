'use client';

// 처음 한 번 서비스 언어를 고르는 화면 — 기기 언어에 한국어·일본어가 없어 신규 가입 때 정하지 못한 사용자에게만 뜬다.
// 어느 언어인지 모르는 사람이 보는 화면이라 문구 묶음 대신 두 언어를 함께 적는다
import type { Locale } from './locale';

const OPTIONS: { locale: Locale; label: string }[] = [
  { locale: 'ko', label: '한국어' },
  { locale: 'ja', label: '日本語' },
];

interface LocaleSelectScreenProps {
  /** 저장 중이면 버튼을 잠근다 */
  pending: boolean;
  /** 저장이 실패했으면 다시 고르라고 알린다 — 실패를 선택 완료로 치지 않는다 */
  failed: boolean;
  onSelect: (locale: Locale) => void;
}

export const LocaleSelectScreen = ({
  pending,
  failed,
  onSelect,
}: LocaleSelectScreenProps) => (
  <div
    role="dialog"
    aria-modal="true"
    aria-labelledby="locale-select-title"
    className="fixed inset-0 z-[100] flex flex-col justify-center bg-background px-6"
  >
    <h1
      id="locale-select-title"
      className="text-center text-22 leading-[1.4] font-bold text-foreground"
    >
      언어를 선택해 주세요
      <br />
      言語を選んでください
    </h1>
    <div className="mt-10 flex flex-col gap-3">
      {OPTIONS.map(({ locale, label }) => (
        <button
          key={locale}
          type="button"
          lang={locale}
          disabled={pending}
          onClick={() => onSelect(locale)}
          className="rounded-2xl border border-border bg-card py-5 text-18 font-bold text-foreground transition-colors active:bg-muted disabled:opacity-50"
        >
          {label}
        </button>
      ))}
    </div>
    {failed && (
      <p role="alert" className="mt-6 text-center text-14 text-destructive">
        저장하지 못했어요. 다시 선택해 주세요
        <br />
        保存できませんでした。もう一度選んでください
      </p>
    )}
  </div>
);
