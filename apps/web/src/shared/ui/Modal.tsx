// 공통 모달 — 오버레이 + 중앙 카드, dismissible=false면 배경클릭·ESC·네이티브 뒤로가기로 안 닫힌다
'use client';

import { useEffect, useRef } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { createPortal } from 'react-dom';

import { useClientOnlyValue } from '@/shared/lib/useClientOnlyValue';
import { registerOpenSheet } from '@/shared/ui/bottom-sheet-back';

interface ModalProps {
  open: boolean;
  onClose: () => void;
  dismissible?: boolean;
  children: React.ReactNode;
}

export function Modal({
  open,
  onClose,
  dismissible = true,
  children,
}: ModalProps) {
  const mounted = useClientOnlyValue(() => true, false);

  // onClose는 대개 인라인 함수라 렌더마다 참조가 바뀐다 — ref로 최신 것을 읽는다
  const onCloseRef = useRef(onClose);
  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    if (!open || !dismissible) return;
    return registerOpenSheet(() => onCloseRef.current());
  }, [open, dismissible]);

  useEffect(() => {
    if (!open || !dismissible) return;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onCloseRef.current();
    };
    window.addEventListener('keydown', closeOnEscape);
    return () => window.removeEventListener('keydown', closeOnEscape);
  }, [open, dismissible]);

  if (!mounted) return null;

  return createPortal(
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            data-testid="modal-backdrop"
            className="fixed inset-0 z-50 bg-black/60"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={dismissible ? onClose : undefined}
          />
          <motion.div
            className="fixed top-1/2 left-1/2 z-50 w-full max-w-[330px] -translate-x-1/2 -translate-y-1/2 rounded-3xl bg-white p-6"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ type: 'spring', damping: 28, stiffness: 300 }}
          >
            {children}
          </motion.div>
        </>
      )}
    </AnimatePresence>,
    document.body,
  );
}
