// 프리미엄 온보딩(/premium/onboarding) — 페이월이 결제를 마치면 `?from=원래 갈 곳`을 붙여 보낸다
import {
  readPremiumOnboardingPreview,
  readReturnParam,
} from '@/shared/lib/routes';

import { PremiumOnboardingScreen } from './_ui/PremiumOnboardingScreen';

export default async function PremiumOnboardingPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { from, preview } = await searchParams;
  return (
    <PremiumOnboardingScreen
      returnTo={readReturnParam(from)}
      preview={readPremiumOnboardingPreview(preview)}
    />
  );
}
