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
  // 같은 URL로의 재실행(StrictMode 이중 마운트, searchParams 참조 변경)에 중복 발화하지 않게 막는다
  const lastUrlRef = useRef<string | null>(null);

  useEffect(() => {
    const url = `${pathname}?${searchParams.toString()}`;
    if (lastUrlRef.current === url) return;
    lastUrlRef.current = url;

    const props = toPageView(pathname, searchParams);
    if (props) track(EVENTS.PAGE_VIEWED, props);
  }, [pathname, searchParams]);

  return null;
};

export const PageViewTracker = () => (
  <Suspense fallback={null}>
    <Tracker />
  </Suspense>
);
