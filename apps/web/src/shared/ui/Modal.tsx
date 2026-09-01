// 공통 모달 — 오버레이 + 중앙 카드, dismissible=false면 배경클릭·ESC·네이티브 뒤로가기로 안 닫힌다
'use client';

import { useEffect, useRef } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { createPortal } from 'react-dom';

import { useClientOnlyValue } from '@/shared/lib/useClientOnlyValue';
import { useFocusTrap } from '@/shared/lib/useFocusTrap';

import { registerOpenSheet } from './bottom-sheet-back';
import { CloseIcon } from './Icons';

interface ModalProps {
  open: boolean;
  onClose: () => void;
  dismissible?: boolean;
  // 스크린 리더가 읽을 다이얼로그 이름 — 없으면 "대화 상자"라고만 읽힌다
  label: string;
  children: React.ReactNode;
}

export function Modal({
  open,
  onClose,
  dismissible = true,
  label,
  children,
}: ModalProps) {
  const mounted = useClientOnlyValue(() => true, false);
  const panelRef = useRef<HTMLDivElement>(null);

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

  // 포커스를 다이얼로그 안에 가두고, 닫히면 이전 포커스로 되돌린다
  useFocusTrap(open, panelRef);

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
            ref={panelRef}
            role="dialog"
            aria-modal="true"
            aria-label={label}
            tabIndex={-1}
            className="fixed top-1/2 left-1/2 z-50 w-full max-w-[330px] -translate-x-1/2 -translate-y-1/2 rounded-3xl bg-white p-6 outline-none"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ type: 'spring', damping: 28, stiffness: 300 }}
          >
            {/* 닫을 수 있는 모달엔 닫는 길이 보여야 한다 — 배경 탭·뒤로가기는 아는 사람만 쓴다.
                내용 위에 겹쳐 둔다 — 자기 줄을 주면 카드 위에 빈 띠가 생긴다 */}
            {dismissible && (
              <button
                type="button"
                onClick={onClose}
                aria-label="닫기"
                className="absolute top-5 right-5 flex size-8 items-center justify-center rounded-full text-muted-foreground transition-transform active:scale-90"
              >
                <CloseIcon size={22} />
              </button>
            )}
            {children}
          </motion.div>
        </>
      )}
    </AnimatePresence>,
    document.body,
  );
}
