'use client';

// 셸에서 현재 오퍼링을 받아 온다 — 결제 가능한 셸에서만 묻고, 못 받으면 빈 오퍼링(화면은 등록값을 유지).
// 정가와 할인을 갈라 돌려주므로 페이월은 연간만 할인을, 이탈 할인 시트는 할인을 쓴다
import { useEffect, useState, useSyncExternalStore } from 'react';
import type { OfferingPackage } from '@landit/bridge';

import { reportWarning } from '@/shared/monitoring/report';

import {
  fetchOfferingsViaBridge,
  resolvePurchaseSupport,
} from '../../api/shell-purchases';
import { toOffering, unclassifiablePackages, type Offering } from './offering';

const EMPTY: Offering = { regular: {}, promo: {} };

// 셸 컨텍스트는 주입된 뒤 바뀌지 않아 구독할 것이 없다. 서버 렌더에는 셸이 없다
const subscribeNothing = () => () => {};
const canAskShell = () => resolvePurchaseSupport() === 'ready';
const cannotAskOnServer = () => false;

// 플랜을 못 정한 패키지는 화면에서 조용히 빠진다 — 할인 패키지가 그렇게 되면 시트가 안 뜨는데도
// 서버·화면 어디에도 흔적이 없다. 스토어 설정이 어긋난 것이라 여기서 한 번 알린다
const reportUnclassifiable = (packages: OfferingPackage[]) => {
  const unknown = unclassifiablePackages(packages);
  if (unknown.length === 0) return;
  reportWarning('오퍼링에 플랜을 알 수 없는 패키지가 있다', {
    packages: unknown.map((pkg) => ({ id: pkg.id, period: pkg.period })),
  });
};

/**
 * 페이월이 뜰 때 셸에 오퍼링을 한 번 묻는다.
 *
 * @param enabled 꺼 두면 묻지 않는다 — 가격을 쓸 사람에게만 왕복을 건다
 * @returns 정가·할인으로 가른 오퍼링. 브라우저·구버전 셸이거나 아직 못 받았으면 둘 다 빈 객체.
 *   `pending`은 셸에 묻고 답을 기다리는 동안만 참이다 — 그동안 결제하면 할인 패키지가 오기 전의 표준 패키지(`DEFAULT_PACKAGE_IDS`)로 나간다.
 *   `settled`는 셸이 답을 마쳤을 때만 참이다 — 그때 가격이 비어 있으면 셸이 스토어 가격을 못 준 것이다.
 *   `retry`는 셸에 다시 묻는다
 */
export const useOffering = ({
  enabled = true,
}: { enabled?: boolean } = {}): Offering & {
  pending: boolean;
  settled: boolean;
  retry: () => void;
} => {
  const [offering, setOffering] = useState<Offering>(EMPTY);
  const [answered, setAnswered] = useState(false);
  // 다시 묻기를 누를 때마다 올라 왕복을 새로 건다
  const [attempt, setAttempt] = useState(0);
  const asking =
    useSyncExternalStore(subscribeNothing, canAskShell, cannotAskOnServer) &&
    enabled;

  useEffect(() => {
    if (!asking) return;
    const controller = new AbortController();
    void fetchOfferingsViaBridge(controller.signal).then((reply) => {
      // 끊긴 왕복이 다음 왕복의 대기를 풀지 않게 한다
      if (controller.signal.aborted) return;
      setAnswered(true);
      if (!reply) return;
      reportUnclassifiable(reply.packages);
      setOffering(toOffering(reply.packages));
    });
    // 화면이 사라지면 끊는다 — 끊긴 왕복은 null로 끝나 setState가 일어나지 않는다
    return () => controller.abort();
  }, [asking, attempt]);

  const retry = () => {
    setAnswered(false);
    setAttempt((count) => count + 1);
  };

  return {
    ...offering,
    pending: asking && !answered,
    settled: asking && answered,
    retry,
  };
};
