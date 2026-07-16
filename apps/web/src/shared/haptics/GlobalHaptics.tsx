'use client';

// 앱 전역에서 탭 가능한 요소(버튼·링크 등)를 누를 때마다 가벼운 햅틱 틱을 울리는 전역 리스너 — 루트에 마운트한다
import { useEffect } from 'react';
import { hapticPatternSchema, type HapticPattern } from '@landit/bridge';

import { haptic } from './haptics';

// 틱을 줄 탭 대상. data-haptic이 붙은 임의 요소도 포함해 개별 오버라이드를 허용한다
const TAP_SELECTOR = 'button, a[href], [role="button"], summary, [data-haptic]';

// 눌린 지점에서 가장 가까운 탭 대상을 찾아 어떤 패턴을 울릴지 정한다. 대상이 없거나 비활성이면 null
export const resolveTapPattern = (
  target: EventTarget | null,
): HapticPattern | null => {
  if (!(target instanceof Element)) return null;

  const el = target.closest(TAP_SELECTOR);
  if (!el) return null;

  // data-no-haptic 하위 트리는 통째로 제외 (진동을 원치 않는 영역 옵트아웃)
  if (el.closest('[data-no-haptic]')) return null;

  // 비활성 버튼은 눌러도 아무 동작이 없으니 진동도 주지 않는다
  if (el.matches(':disabled') || el.getAttribute('aria-disabled') === 'true') {
    return null;
  }

  // data-haptic으로 특정 요소만 더 센 패턴으로 오버라이드 (예: data-haptic="medium")
  const override = el.getAttribute('data-haptic');
  if (override) {
    const parsed = hapticPatternSchema.safeParse(override);
    return parsed.success ? parsed.data : 'selection';
  }

  return 'selection';
};

export const GlobalHaptics = () => {
  useEffect(() => {
    // pointerdown이라 눌리는 즉시(네이티브 버튼처럼) 울린다. 주 포인터만 처리해 멀티터치 중복을 막는다
    const onPointerDown = (event: PointerEvent) => {
      if (!event.isPrimary) return;
      const pattern = resolveTapPattern(event.target);
      if (pattern) haptic(pattern);
    };

    document.addEventListener('pointerdown', onPointerDown);
    return () => document.removeEventListener('pointerdown', onPointerDown);
  }, []);

  return null;
};
