'use client';

// 대화 화면에서 키보드로 입력하는 동안 문서 스크롤을 맨 위에 붙잡는 훅.
// iOS 웹뷰는 입력창에 포커스가 가면 키보드에 가리지 않게 문서를 위로 민다. 화면은 이미 키보드 높이만큼
// 아래를 비워 입력창을 올리므로(useKeyboardInset), 그대로 두면 두 번 올라가 무대가 상태바 밑으로 사라진다
import { useEffect } from 'react';

export const useDocumentScrollPin = (active: boolean) => {
  useEffect(() => {
    if (!active) return;
    const resetScroll = () => {
      if (window.scrollY !== 0) window.scrollTo(0, 0);
    };
    resetScroll();
    const viewport = window.visualViewport;
    window.addEventListener('scroll', resetScroll);
    viewport?.addEventListener('scroll', resetScroll);
    viewport?.addEventListener('resize', resetScroll);
    return () => {
      window.removeEventListener('scroll', resetScroll);
      viewport?.removeEventListener('scroll', resetScroll);
      viewport?.removeEventListener('resize', resetScroll);
    };
  }, [active]);
};
