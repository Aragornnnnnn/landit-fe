'use client';

// 환급을 아직 시작하지 않은 사람이 보는 환급 화면 — 무엇을 하면 얼마를 돌려받는지 보여 주고 페이월로 보낸다
import { useRouter } from 'next/navigation';

import { MAX_REFUND_WON } from '@/features/reward/model/refund-offer';
import { RefundGuide } from '@/features/reward/ui/RefundGuide';
import { paywallPath, REFUND_PATH } from '@/shared/lib/routes';
import { formatWon } from '@/shared/lib/won';
import { Button } from '@/shared/ui/Button';

export const RefundIntro = () => (
  <div className="pb-8">
    <RefundGuide
      amount={`최대 ${formatWon(MAX_REFUND_WON)}`}
      caption="6개월은 낸 금액 전부, 3개월은 80%를 돌려받아요"
    />
  </div>
);

// 아래 고정 버튼 — 환급을 시작하려면 결제부터다
export const RefundStartButton = () => {
  const router = useRouter();

  return (
    <Button
      onClick={() =>
        // 결제하고 돌아오면 이 화면이 다시 열린다 — 기록에 같은 화면이 두 번 쌓이지 않게 갈아 끼운다
        router.replace(paywallPath({ source: 'refund', from: REFUND_PATH }))
      }
    >
      프리미엄 시작하고 환급받기
    </Button>
  );
};
