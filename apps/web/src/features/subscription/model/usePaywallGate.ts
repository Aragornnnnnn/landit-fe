'use client';

// 학습 진입 게이트 — 진입 지점(표현 학습·카드 뒤집기·스몰톡 시작)이 guard로 감싸 부르면,
// 무료 사용자는 페이월로 보내고 나머지는 그대로 들여보낸다 (docs/subscription.md 「무료 구간과 페이월 게이트」).
// 시나리오 대화는 문이 아니다 — 구독과 관계없이 열려 있고, 상세 피드백 잠금은 서버가 피드백 응답에서 정한다
import { EVENTS, type PaywallGateEntry } from '@landit/analytics';
import { useRouter } from 'next/navigation';

import { track } from '@/shared/analytics';
import { getNativeContextSnapshot } from '@/shared/bridge/native-context';
import { paywallPath } from '@/shared/lib/routes';
import { useClientOnlyValue } from '@/shared/lib/useClientOnlyValue';

import { PAYMENT_ENABLED } from './payment-flag';
import { canLockPaywall, decidePaywallGate } from './paywall-gate';
import { useSubscriptionQuery } from './useSubscriptionQuery';

interface GuardOptions {
  /** 계측용 — 어느 문에서 막혔는지 */
  entry: PaywallGateEntry;
  /** 결제 뒤 돌아올 곳. 없으면 페이월이 홈으로 보낸다 */
  returnTo?: string;
  /** 잠겼을 때 지금 화면을 히스토리에서 지우고 간다 — 호출부의 이동이 replace라 뒤로 돌아가면 안 되는 자리 */
  replace?: boolean;
}

/**
 * 학습 진입을 감싸는 게이트.
 *
 * @returns `guard(이동, 옵션)`은 열려 있으면 이동을 그대로 실행하고, 잠겼으면 계측을 남기고 페이월로 보낸다.
 *   `locked`는 이 사람에게 학습 문이 잠기는지 — 피드백 뒤 어디로 갈지 정할 때 쓴다
 */
export const usePaywallGate = () => {
  const router = useRouter();
  // 셸 컨텍스트는 클라이언트에서만 — 서버 렌더와 첫 렌더를 맞추려고 그때까지는 브라우저로 본다
  const context = useClientOnlyValue(getNativeContextSnapshot, null);
  const environment = {
    paymentEnabled: PAYMENT_ENABLED,
    appVersion: context?.appVersion ?? null,
  };
  // 잠글 수 없는 환경(플래그 꺼짐·브라우저·구버전 셸)에서는 구독을 묻지 않는다 — 어차피 열린다
  const { subscription, isError } = useSubscriptionQuery({
    enabled: canLockPaywall(environment),
  });

  // 구독 조회 실패(구독 API 미배포 포함)는 잠그지 않는다 — 잘못 막는 쪽이 더 나쁘다.
  // 아직 못 받았으면 null — decidePaywallGate가 unknown으로 두고, unknown도 막지 않는다 (다음 진입에서 잡힌다)
  const decision = isError
    ? 'open'
    : decidePaywallGate({
        ...environment,
        premium: subscription?.premium ?? null,
      });
  const locked = decision === 'locked';

  const guard = (
    go: () => void,
    { entry, returnTo, replace = false }: GuardOptions,
  ) => {
    if (!locked) {
      go();
      return;
    }
    track(EVENTS.PAYWALL_GATE_LOCKED, { entry });
    const to = paywallPath({ from: returnTo });
    if (replace) router.replace(to);
    else router.push(to);
  };

  return { locked, guard };
};
