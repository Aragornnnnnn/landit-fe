// 환급 점검(/me/developer/reward) — ADMIN 전용, 서버 없이 가짜 값으로 환급 화면을 케이스별로 연다
import { Suspense } from 'react';

import { RewardCheckScreen } from './_ui/RewardCheckScreen';

export default function RewardCheckPage() {
  return (
    // 고른 케이스를 주소(?case=)에서 읽는다
    <Suspense>
      <RewardCheckScreen />
    </Suspense>
  );
}
