'use client';

// 셸에서 현재 오퍼링을 받아 온다 — 결제 가능한 셸에서만 묻고, 못 받으면 빈 오퍼링(화면은 등록값을 유지).
// 정가와 할인을 갈라 돌려주므로 페이월은 정가를, 이탈 할인 시트는 할인을 쓴다
import { useEffect, useState } from 'react';
import type { OfferingPackage } from '@landit/bridge';

import { reportWarning } from '@/shared/monitoring/report';

import {
  fetchOfferingsViaBridge,
  resolvePurchaseSupport,
} from '../../api/shell-purchases';
import { toOffering, unclassifiablePackages, type Offering } from './offering';

const EMPTY: Offering = { regular: {}, promo: {} };

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
 * @returns 정가·할인으로 가른 오퍼링. 브라우저·구버전 셸이거나 아직 못 받았으면 둘 다 빈 객체
 */
export const useOffering = (): Offering => {
  const [offering, setOffering] = useState<Offering>(EMPTY);

  useEffect(() => {
    if (resolvePurchaseSupport() !== 'ready') return;
    const controller = new AbortController();
    void fetchOfferingsViaBridge(controller.signal).then((reply) => {
      if (!reply) return;
      reportUnclassifiable(reply.packages);
      setOffering(toOffering(reply.packages));
    });
    // 화면이 사라지면 끊는다 — 끊긴 왕복은 null로 끝나 setState가 일어나지 않는다
    return () => controller.abort();
  }, []);

  return offering;
};
