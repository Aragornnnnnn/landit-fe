// 소프트 업데이트 시트 — 닫을 수 있고, 명시적으로 미룰 수 있는 버튼도 제공한다
import { BottomSheet } from '@/shared/ui/BottomSheet';
import { Button } from '@/shared/ui/Button';

import { goToStore } from '../../model/goToStore';

interface SoftUpdateSheetProps {
  reason: string | null;
  onClose: () => void;
}

const DEFAULT_REASON = '새로워진 기능을 만나보세요';

export const SoftUpdateSheet = ({ reason, onClose }: SoftUpdateSheetProps) => (
  <BottomSheet open onClose={onClose}>
    <div className="flex flex-col items-center text-center">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/images/character/landy-fighting.webp"
        alt="랜디"
        className="object-contain"
        style={{ width: 120, height: 120 }}
      />
      <h2 className="mt-4 text-lg font-bold text-foreground">
        Landit 새 버전 출시!
      </h2>
      <p className="mt-4 text-sm leading-6 text-muted-foreground">
        {reason?.trim() || DEFAULT_REASON}
      </p>
    </div>
    <Button className="mt-5" onClick={goToStore}>
      업데이트하러 가기
    </Button>
    <button
      type="button"
      className="mt-4 w-full text-center text-sm font-semibold text-foreground"
      onClick={onClose}
    >
      나중에 할래요
    </button>
  </BottomSheet>
);
