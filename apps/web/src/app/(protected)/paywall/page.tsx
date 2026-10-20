// 프리미엄 페이월(/paywall). 게이트(LAN-448)가 학습 진입에서 `?from=돌아갈곳`을, 환급 화면이 `?step=checkout`(결제 금액 안내부터)을 붙여 보낸다
import { readPaywallSource } from '@/shared/analytics/page-view';
import { readPaywallStep, readReturnParam } from '@/shared/lib/routes';

import { PaywallScreen } from './_ui/PaywallScreen';

export default async function PaywallPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { from, step, source } = await searchParams;
  return (
    <PaywallScreen
      returnTo={readReturnParam(from)}
      startStep={readPaywallStep(step)}
      source={readPaywallSource(typeof source === 'string' ? source : null)}
    />
  );
}
