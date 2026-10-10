// 결제 직후, 알람 바로 앞에 놓는 환급 안내 — 결제 전에 본 환급 소개와 같은 모습으로 규칙을 한 번 더 보여 주고 알람으로 잇는다
import { RefundGuide } from '@/features/reward/ui/RefundGuide';
import { Button } from '@/shared/ui/Button';

import type { RefundGuideCopy } from '../_model/refund-guide-copy';

export const RefundGuideStep = ({
  copy,
  onNext,
}: {
  copy: RefundGuideCopy;
  onNext: () => void;
}) => (
  <main className="flex h-dvh flex-col bg-background">
    <div className="pt-[max(var(--safe-area-inset-top),16px)]" />
    <div className="min-h-0 flex-1 overflow-y-auto pb-6">
      <RefundGuide
        eyebrow={copy.eyebrow}
        amount={copy.amount}
        caption={copy.caption}
      />
    </div>
    <footer className="flex-none border-t border-border px-5 pt-3 pb-[max(var(--safe-area-inset-bottom),16px)]">
      <Button onClick={onNext}>다음</Button>
    </footer>
  </main>
);
