'use client';

// 모달·사진 크게 보기가 같이 쓰는 대화 상자 동작 — 열려 있는 동안 뒤로가기·Escape로 맨 위 하나를 닫고, 포커스를 안에 가둔다
import { useEffect, useEffectEvent, useRef } from 'react';

import { useClientOnlyValue } from '@/shared/lib/useClientOnlyValue';
import { useFocusTrap } from '@/shared/lib/useFocusTrap';

import { registerOpenSheet } from './bottom-sheet-back';

interface DialogLayerOptions {
  open: boolean;
  // false면 뒤로가기·Escape로 닫히지 않는다 (배경 클릭은 그리는 쪽이 정한다)
  dismissible: boolean;
  onClose: () => void;
}

export const useDialogLayer = ({
  open,
  dismissible,
  onClose,
}: DialogLayerOptions) => {
  const mounted = useClientOnlyValue(() => true, false);
  const panelRef = useRef<HTMLDivElement>(null);

  // onClose는 대개 인라인 함수라 렌더마다 참조가 바뀐다 — 부를 땐 최신 것을 쓰되,
  // 리렌더 때 스택에서 빠졌다 다시 올라가며 순서가 뒤집히지 않게 등록은 열릴 때 한 번만 한다
  const close = useEffectEvent(onClose);

  // 열려 있는 동안 전역 스택에 등록 — 네이티브 뒤로가기와 Escape가 화면 이동 대신 맨 위 대화 상자를 닫는다
  useEffect(() => {
    if (!open || !dismissible) return;
    return registerOpenSheet(() => close());
  }, [open, dismissible]);

  // mounted를 함께 보는 이유 — 패널은 mounted 뒤에야 그려지는데, open만 보면
  // 처음부터 열린 대화 상자에서 ref가 빈 채로 effect가 한 번 돌고 다시 돌지 않는다
  useFocusTrap(open && mounted, panelRef);

  return { mounted, panelRef };
};
