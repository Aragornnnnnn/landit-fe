'use client';

// 라우트 변경마다 Page Viewed를 발화한다 — useSearchParams 규칙 때문에 Suspense로 감싼다
import { Suspense, useEffect } from 'react';
import { EVENTS } from '@landit/analytics';
import { usePathname, useSearchParams } from 'next/navigation';

import { track } from './amplitude';
import { toPageView } from './page-view';

const Tracker = () => {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
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
