// 프리미엄 페이월(/paywall). 게이트(LAN-448)가 학습 진입에서 `?from=돌아갈곳`을 붙여 보낸다
import { TOUR_PAYWALL_SOURCE } from '@/features/tour/model/tour-paywall';
import { readReturnParam } from '@/shared/lib/routes';

import { PaywallScreen } from './_ui/PaywallScreen';
import { TourCompletion } from './_ui/TourCompletion';

export default async function PaywallPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { from, source } = await searchParams;
  return (
    <>
      <PaywallScreen returnTo={readReturnParam(from)} />
      {/* 첫 표현 투어가 보낸 페이월이면 투어를 끝낸 것으로 남긴다 */}
      {source === TOUR_PAYWALL_SOURCE && <TourCompletion />}
    </>
  );
}
