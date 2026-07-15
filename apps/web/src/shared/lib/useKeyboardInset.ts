'use client';

// 네이티브 키보드가 가린 하단 높이(px)를 visualViewport로 추적한다.
// WKWebView/안드로이드 웹뷰는 키보드가 올라와도 레이아웃 뷰포트(dvh)가 줄지 않아,
// 하단 고정 입력창이 키보드에 가린다. 이 값을 padding-bottom으로 주어 입력창을 키보드 위로 올린다.
import { useEffect, useState } from 'react';

export const useKeyboardInset = (): number => {
  const [inset, setInset] = useState(0);

  useEffect(() => {
    const vv = window.visualViewport;
    if (!vv) return;

    const update = () => {
      // 레이아웃 뷰포트 대비 가려진 하단 높이 = 키보드 높이(스크롤 오프셋 보정)
      const covered = window.innerHeight - vv.height - vv.offsetTop;
      setInset(Math.max(0, Math.round(covered)));
    };

    update();
    vv.addEventListener('resize', update);
    vv.addEventListener('scroll', update);
    return () => {
      vv.removeEventListener('resize', update);
      vv.removeEventListener('scroll', update);
    };
  }, []);

  return inset;
};
