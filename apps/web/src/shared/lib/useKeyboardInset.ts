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

    // 키보드 없는 상태의 레이아웃 높이. iOS 웹뷰는 키보드가 뜨는 순간 innerHeight까지 잠깐 줄였다가
    // 알리지 않고 되돌리므로, 그 찰나의 값 대신 지금까지 본 가장 큰 높이를 기준으로 잰다
    let layoutHeight = window.innerHeight;

    const update = () => {
      layoutHeight = Math.max(layoutHeight, window.innerHeight);
      // 레이아웃 뷰포트 대비 가려진 하단 높이 = 키보드 높이(스크롤 오프셋 보정)
      const covered = layoutHeight - vv.height - vv.offsetTop;
      setInset(Math.max(0, Math.round(covered)));
    };

    update();
    vv.addEventListener('resize', update);
    vv.addEventListener('scroll', update);
    // 키보드가 문서를 밀었다 되돌아올 때 vv 이벤트 없이 window 스크롤만 오는 경우가 있다
    window.addEventListener('scroll', update);
    window.addEventListener('resize', update);
    return () => {
      vv.removeEventListener('resize', update);
      vv.removeEventListener('scroll', update);
      window.removeEventListener('scroll', update);
      window.removeEventListener('resize', update);
    };
  }, []);

  return inset;
};
