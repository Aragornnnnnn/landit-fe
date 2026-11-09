'use client';

// 버튼·링크를 누르면 스크롤·끌기와 상관없는 곳은 닿는 순간, 아니면 탭이 성립할 때 가벼운 햅틱 틱을 울리는 전역 리스너 (루트에 마운트)
import { useEffect } from 'react';
import { hapticPatternSchema, type HapticPattern } from '@landit/bridge';

import { haptic } from './haptics';
import { classifyPressArea, type PressArea } from './press-area';

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

  // 비활성 버튼은 눌러도 아무 동작이 없으니 진동도 주지 않는다 (비활성 버튼 안쪽 요소 포함)
  if (el.closest(':disabled, [aria-disabled="true"]')) return null;

  // data-haptic으로 특정 요소만 더 센 패턴으로 오버라이드 (예: data-haptic="medium")
  const override = el.getAttribute('data-haptic');
  if (override) {
    const parsed = hapticPatternSchema.safeParse(override);
    return parsed.success ? parsed.data : 'light';
  }

  return 'light';
};

// 끌기 요소에서 누른 자리로부터 이만큼(px) 움직이면 탭이 아니라 끌기로 본다 (Framework7이 탭을 거르는 거리와 같다)
const TAP_SLOP_PX = 5;

type PendingTap = {
  tapTarget: Element;
  pointerId: number;
  x: number;
  y: number;
  pattern: HapticPattern;
  area: Exclude<PressArea, 'still'>;
  // 손가락이 조금이라도 움직였나. 가만히 있는 동안의 스크롤은 코드가 한 것(채팅 자동 스크롤 등)이라 탭을 취소하지 않는다
  fingerMoved: boolean;
};

export const GlobalHaptics = () => {
  useEffect(() => {
    // 스크롤 영역·끌기 요소에서 누른 탭. 손을 떼 탭이 성립한 click에서 울린다
    let pending: PendingTap | null = null;

    // 스크롤·끌기와 상관없는 버튼은 닿는 순간 울리고, 아니면 탭이 성립할 때까지 미룬다
    const pressTap = (event: PointerEvent) => {
      pending = null;
      // 두 번째 손가락(핀치 등)과 마우스 오른쪽·가운데 버튼은 탭이 아니다
      if (!event.isPrimary || event.button !== 0) return;
      if (!(event.target instanceof Element)) return;
      const pattern = resolveTapPattern(event.target);
      const tapTarget = event.target.closest(TAP_SELECTOR);
      if (!pattern || !tapTarget) return;
      const area = classifyPressArea(tapTarget);
      if (area === 'still') {
        haptic(pattern);
        return;
      }
      pending = {
        tapTarget,
        pointerId: event.pointerId,
        x: event.clientX,
        y: event.clientY,
        pattern,
        area,
        fingerMoved: false,
      };
    };

    // 끌기 요소는 끌고 놓아도 click이 오므로 움직인 거리로 직접 거른다. 스크롤 영역은 브라우저의 취소 신호에 맡긴다
    const dropTapIfMoved = (event: PointerEvent) => {
      if (!pending || event.pointerId !== pending.pointerId) return;
      pending.fingerMoved = true;
      if (pending.area !== 'drag') return;
      const moved = Math.hypot(
        event.clientX - pending.x,
        event.clientY - pending.y,
      );
      if (moved >= TAP_SLOP_PX) pending = null;
    };

    // 브라우저가 스크롤로 넘겨받으면 pointercancel이 온다
    const dropTapOnCancel = (event: PointerEvent) => {
      if (pending && event.pointerId === pending.pointerId) pending = null;
    };

    // 손가락이 움직이며 누른 버튼을 감싼 영역(페이지 포함)이 스크롤되면 취소 신호가 빠져도 탭이 아니다
    const dropTapOnScroll = (event: Event) => {
      if (!pending?.fingerMoved) return;
      const scrolled = event.target;
      if (
        scrolled instanceof Document ||
        (scrolled instanceof Node && scrolled.contains(pending.tapTarget))
      ) {
        pending = null;
      }
    };

    // capture 단계라 React onClick 안의 결과 진동(success 등)보다 틱이 먼저 간다
    const fireTap = (event: MouseEvent) => {
      if (!pending) return;
      const { tapTarget, pattern } = pending;
      pending = null;
      // 키보드·코드가 보낸 click(detail 0)과 누른 버튼 밖에서 뗀 click은 이 누름의 탭이 아니다
      if (event.detail === 0) return;
      if (event.target instanceof Node && tapTarget.contains(event.target)) {
        haptic(pattern);
      }
    };

    const options = { capture: true, passive: true } as const;
    document.addEventListener('pointerdown', pressTap, options);
    document.addEventListener('pointermove', dropTapIfMoved, options);
    document.addEventListener('pointercancel', dropTapOnCancel, options);
    document.addEventListener('scroll', dropTapOnScroll, options);
    document.addEventListener('click', fireTap, options);
    return () => {
      document.removeEventListener('pointerdown', pressTap, options);
      document.removeEventListener('pointermove', dropTapIfMoved, options);
      document.removeEventListener('pointercancel', dropTapOnCancel, options);
      document.removeEventListener('scroll', dropTapOnScroll, options);
      document.removeEventListener('click', fireTap, options);
    };
  }, []);

  return null;
};
