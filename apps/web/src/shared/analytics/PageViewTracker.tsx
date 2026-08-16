'use client';

// 라우트 변경마다 Page Viewed를 발화한다 — useSearchParams 규칙 때문에 Suspense로 감싼다
import { Suspense, useEffect, useRef } from 'react';
import { EVENTS } from '@landit/analytics';
import { usePathname, useSearchParams } from 'next/navigation';

import { track } from './amplitude';
import { toPageView } from './page-view';

const Tracker = () => {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  // 재실행(StrictMode 이중 마운트, searchParams 참조 변경)에 중복 발화하지 않게 막는다.
  // 주소가 아니라 보낼 속성으로 비교한다 — 화면 안에서 쓰는 쿼리(편지함의 ?box=)가 바뀐 것뿐이면
  // 같은 화면을 계속 보고 있는 것이라 페이지뷰가 아니다
  const lastPropsRef = useRef<string | null>(null);

  useEffect(() => {
    const props = toPageView(pathname, searchParams);
    // 계측 제외 화면을 지나면 표식도 비운다 — 안 그러면 되돌아온 화면을 같은 화면으로 착각한다
    if (!props) {
      lastPropsRef.current = null;
      return;
    }

    const signature = JSON.stringify(props);
    if (lastPropsRef.current === signature) return;
    lastPropsRef.current = signature;

    track(EVENTS.PAGE_VIEWED, props);
  }, [pathname, searchParams]);

  return null;
};

export const PageViewTracker = () => (
  <Suspense fallback={null}>
    <Tracker />
  </Suspense>
);
