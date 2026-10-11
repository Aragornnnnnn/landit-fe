'use client';

// 오늘 표현을 다 끝내 환급액을 받은 순간 — 받은 금액과 오늘 남은 몫을 보여 주고, 확인을 누르면 목록으로 돌아간다
// 가로 import 사유: 받은 금액을 그리는 부품은 환급 쪽에 있고, 표현 완료를 아는 곳은 여기뿐이다
import type { ExpressionsEarn } from '@/features/reward/model/completion-earn';
import { EarnedStamp } from '@/features/reward/ui/EarnedStamp';
import { Button } from '@/shared/ui/Button';

import { TITLE_CLASS } from './ExpressionStages';

export const ExpressionsEarned = ({
  earn,
  onConfirm,
}: {
  earn: ExpressionsEarn;
  onConfirm: () => void;
}) => (
  <main
    className="mx-auto flex h-dvh max-w-[430px] flex-col bg-background px-6 pb-[max(var(--safe-area-inset-bottom),24px)]"
    style={{ paddingTop: 'var(--safe-area-inset-top)' }}
  >
    {/* 대화 완료 축하와 같은 자리에 제목이 서게 헤더 높이만큼 비운다 */}
    <div className="h-14 flex-none" />
    <h1 className={TITLE_CLASS}>
      {`표현 ${earn.expressionCount}개를\n모두 익혔어요!`}
    </h1>
    <EarnedStamp earn={earn} />
    <Button size="lg" onClick={onConfirm}>
      확인
    </Button>
  </main>
);
