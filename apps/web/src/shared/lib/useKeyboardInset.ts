'use client';

// 네이티브 키보드가 가린 하단 높이(px)를 visualViewport로 추적한다.
// WKWebView/안드로이드 웹뷰는 키보드가 올라와도 레이아웃 뷰포트(dvh)가 줄지 않아,
// 하단 고정 입력창이 키보드에 가린다. 이 값을 padding-bottom으로 주어 입력창을 키보드 위로 올린다.
import { useSyncExternalStore } from 'react';

// iOS 웹뷰는 키보드가 뜨는 순간 innerHeight까지 잠깐 줄였다가 알리지 않고 되돌린다.
// 그 순간의 값으로 재면 0이 나오므로, 뷰포트 이벤트 뒤 조금 있다가 두 번 더 잰다
const RECHECK_DELAYS_MS = [80, 250];

// 레이아웃 뷰포트 대비 가려진 하단 높이 = 키보드 높이(스크롤 오프셋 보정)
const readInset = () => {
  const vv = window.visualViewport;
  if (!vv) return 0;
  const covered = window.innerHeight - vv.height - vv.offsetTop;
  return Math.max(0, Math.round(covered));
};

// 서버에는 키보드가 없다
const noKeyboard = () => 0;

const subscribe = (onChange: () => void) => {
  const vv = window.visualViewport;
  if (!vv) return () => {};

  let rechecks: number[] = [];
  const changeAndRecheck = () => {
    onChange();
    rechecks.forEach((id) => window.clearTimeout(id));
    rechecks = RECHECK_DELAYS_MS.map((ms) => window.setTimeout(onChange, ms));
  };

  vv.addEventListener('resize', changeAndRecheck);
  vv.addEventListener('scroll', changeAndRecheck);
  // 키보드가 문서를 밀었다 되돌아올 때 vv 이벤트 없이 window 스크롤만 오는 경우가 있다
  window.addEventListener('scroll', onChange);
  window.addEventListener('resize', onChange);
  return () => {
    rechecks.forEach((id) => window.clearTimeout(id));
    vv.removeEventListener('resize', changeAndRecheck);
    vv.removeEventListener('scroll', changeAndRecheck);
    window.removeEventListener('scroll', onChange);
    window.removeEventListener('resize', onChange);
  };
};

export const useKeyboardInset = (): number =>
  useSyncExternalStore(subscribe, readInset, noKeyboard);
