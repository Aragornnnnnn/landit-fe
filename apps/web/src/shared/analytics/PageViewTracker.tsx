'use client';

// 라우트 변경마다 Page Viewed를 발화한다 — useSearchParams 규칙 때문에 Suspense로 감싼다
import { Suspense, useEffect, useRef } from 'react';
import { EVENTS } from '@landit/analytics';
import { usePathname, useSearchParams } from 'next/navigation';

import { track } from './amplitude';
import { toPageView } from './page-view';

// 직전 페이지뷰 속성에서 유입 딱지만 뺀 서명 — 유입 딱지만 사라진 재렌더를 알아보는 데 쓴다
const withoutEntry = (signature: string | null) => {
  if (signature === null) return null;
  const props = JSON.parse(signature) as Record<string, unknown>;
  delete props.entry_campaign;
  delete props.entry_content;
  return JSON.stringify(props);
};

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
    // 외부 유입(알림·위젯) 첫 화면은 UTM을 읽은 뒤 주소에서 지운다 — 라우터가 같은 화면을 유입 속성만 뺀 채
    // 다시 그리는데, 이건 새 페이지뷰가 아니다. 반대로 보던 화면에 유입 속성이 "붙는" 변화(웜 딥링크)는 쏜다
    if (withoutEntry(lastPropsRef.current) === signature) {
      // 지운 뒤의 모습을 기억해 둔다 — 같은 알림을 곧바로 또 탭하면 그건 새 유입이다
      lastPropsRef.current = signature;
      return;
    }
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
