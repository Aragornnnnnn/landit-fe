// 페이월 맨 위 줄 — 닫기와 구매 복원. 맨 위에 떠 있고(환급 무대 위에선 밝은 글자), 고정하지 않아 스크롤하면 함께 올라간다
import { CloseIcon } from '@/shared/ui/Icons';

interface PaywallHeaderProps {
  /** 어두운 무대 위에 뜨는가 — 밝은 글자로 바꾼다 */
  dark: boolean;
  onClose: () => void;
  onRestore: () => void;
  /** 결제·복원이 진행 중일 때 복원 버튼을 잠근다 */
  restoreDisabled: boolean;
}

export const PaywallHeader = ({
  dark,
  onClose,
  onRestore,
  restoreDisabled,
}: PaywallHeaderProps) => (
  <header className="absolute inset-x-0 top-0 z-20 pt-[max(var(--safe-area-inset-top),8px)]">
    <div className="flex h-10 items-center justify-between pr-5 pl-4">
      <button
        type="button"
        onClick={onClose}
        aria-label="닫기"
        className={`-ml-2 flex size-9 items-center justify-center rounded-full transition-all active:scale-90 ${dark ? 'text-white active:bg-white/10' : 'text-foreground active:bg-black/5'}`}
      >
        <CloseIcon size={24} />
      </button>
      {/* 스토어 심사가 요구하는 구매 복원 진입점 — 애플 지침 3.1.1 */}
      <button
        type="button"
        onClick={onRestore}
        disabled={restoreDisabled}
        className={`text-[13px] leading-none disabled:opacity-50 ${dark ? 'text-white/70' : 'text-muted-foreground'}`}
      >
        구매 복원
      </button>
    </div>
  </header>
);
