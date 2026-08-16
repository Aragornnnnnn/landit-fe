// 밀려 올라온 화면의 머리 — 왼쪽 뒤로가기, 필요하면 가운데 제목
// 스크롤이 시작되면 그림자를 켜서 머리와 본문의 경계를 만든다 (useScrollShadow와 짝)
import { ChevronLeftIcon } from './Icons';

interface BackHeaderProps {
  onBack: () => void;
  title?: string;
  hasShadow?: boolean;
}

export const BackHeader = ({
  onBack,
  title,
  hasShadow = false,
}: BackHeaderProps) => (
  <header
    className="relative flex shrink-0 items-center bg-background px-4 pt-[max(env(safe-area-inset-top),16px)] pb-2 transition-shadow duration-200"
    style={{ boxShadow: hasShadow ? '0 2px 8px rgba(0,0,0,0.06)' : 'none' }}
  >
    <button
      type="button"
      onClick={onBack}
      aria-label="뒤로 가기"
      className="-ml-1 flex size-9 items-center justify-center rounded-full text-muted-foreground transition-all active:scale-90 active:bg-secondary"
    >
      <ChevronLeftIcon size={24} />
    </button>
    {title && (
      <h1 className="absolute left-1/2 -translate-x-1/2 text-[18px] font-bold text-foreground">
        {title}
      </h1>
    )}
  </header>
);
