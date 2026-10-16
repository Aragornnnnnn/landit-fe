'use client';

// 열려 있는 동안 Tab 포커스를 패널 안에 가두고, 닫히면 이전 포커스로 되돌린다.
// 화면을 시각적으로만 덮으면 키보드는 뒤 내용에 그대로 닿는다 — 대화 상자(모달·바텀시트·사진 크게 보기)와 기존 유저 게이트가 함께 쓴다
import { useEffect, type RefObject } from 'react';

const FOCUSABLE_SELECTOR =
  'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';

export function useFocusTrap(
  open: boolean,
  panelRef: RefObject<HTMLElement | null>,
) {
  // 열리면 포커스를 패널로 옮기고, 닫히면 이전 포커스로 되돌린다
  useEffect(() => {
    if (!open) return;
    // 안에서 먼저 포커스를 받은 요소(autoFocus 입력칸)는 그대로 둔다 — 옮기면 모바일 키보드가 닫힌다.
    // 이때는 열기 전 포커스를 알 수 없어 닫혀도 되돌리지 않는다
    if (panelRef.current?.contains(document.activeElement)) return;
    const previouslyFocused = document.activeElement as HTMLElement | null;
    // 바텀시트는 이 순간 아직 화면 밖에서 올라오는 중이다 — 포커스 때문에 문서가 밀리지 않게 한다
    panelRef.current?.focus({ preventScroll: true });
    return () => previouslyFocused?.focus();
  }, [open, panelRef]);

  useEffect(() => {
    if (!open) return;
    const trapFocus = (event: KeyboardEvent) => {
      if (event.key !== 'Tab' || !panelRef.current) return;
      const focusable =
        panelRef.current.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR);
      if (focusable.length === 0) {
        event.preventDefault();
        return;
      }
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      // 열리자마자는 패널 자체가 포커스를 갖고 있어, first가 아니라 패널 기준으로도 검사해야 한다
      const onFirstOrPanel =
        document.activeElement === first ||
        document.activeElement === panelRef.current;
      if (event.shiftKey && onFirstOrPanel) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };
    window.addEventListener('keydown', trapFocus);
    return () => window.removeEventListener('keydown', trapFocus);
  }, [open, panelRef]);
}
