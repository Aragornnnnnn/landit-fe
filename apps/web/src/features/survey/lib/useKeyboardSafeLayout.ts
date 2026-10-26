'use client';

// 키보드가 떠도 화면이 밀리지 않게 — 설문처럼 높이가 늘 뷰포트와 같은 화면이 쓴다.
// 화면 높이를 키보드만큼 줄이는 건 useKeyboardInset이 맡고, 여기선 그 위에 두 가지를 더한다.
// 1) iOS 웹뷰가 입력칸을 보이려고 문서를 위로 미는 걸 되돌린다 — 안 그러면 헤더가 상태바 밑으로 들어간다.
// 2) 줄어든 화면에서 포커스된 입력칸이 목록 아래로 숨으면 목록 안에서만 끌어올린다.
import { useEffect, useRef } from 'react';

import { useDocumentScrollPin } from '@/shared/lib/useDocumentScrollPin';
import { useKeyboardInset } from '@/shared/lib/useKeyboardInset';

export const useKeyboardSafeLayout = () => {
  const keyboardInset = useKeyboardInset();

  useDocumentScrollPin(true);

  // 키보드가 "뜨는 순간"에만 — 높이가 흔들릴 때마다 끌어올리면 입력 중에 화면이 들썩인다
  const wasOpen = useRef(false);
  useEffect(() => {
    const isOpen = keyboardInset > 0;
    const justOpened = isOpen && !wasOpen.current;
    wasOpen.current = isOpen;
    if (!justOpened) return;

    const frame = window.requestAnimationFrame(() => {
      document.activeElement?.scrollIntoView?.({ block: 'nearest' });
    });
    return () => window.cancelAnimationFrame(frame);
  }, [keyboardInset]);

  return keyboardInset;
};
