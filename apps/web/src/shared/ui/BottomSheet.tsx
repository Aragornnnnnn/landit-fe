// 공통 바텀 시트 — 오버레이 + 슬라이드업 패널, 웹 너비 자동 대응
'use client';

import { useEffect, useRef } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { createPortal } from 'react-dom';

import { useClientOnlyValue } from '@/shared/lib/useClientOnlyValue';
import { registerOpenSheet } from '@/shared/ui/bottom-sheet-back';

interface BottomSheetProps {
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
}

export function BottomSheet({ open, onClose, children }: BottomSheetProps) {
  const mounted = useClientOnlyValue(() => true, false);

  // onClose는 대개 인라인 함수라 렌더마다 참조가 바뀐다 — ref로 최신 것을 읽어,
  // 리렌더 때 스택에서 빠졌다 다시 올라가며 시트 순서가 뒤집히지 않게 한다
  const onCloseRef = useRef(onClose);
  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  // 열려 있는 동안 전역 스택에 등록 — 네이티브 뒤로가기가 화면 이동 대신 이 시트를 닫는다
  useEffect(() => {
    if (!open) return;
    return registerOpenSheet(() => onCloseRef.current());
  }, [open]);

  if (!mounted) return null;

  return createPortal(
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            className="fixed inset-0 z-50 bg-black/40"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <motion.div
            className="fixed bottom-0 left-1/2 z-50 w-full max-w-[430px] -translate-x-1/2 rounded-t-3xl bg-white px-6 pt-6"
            style={{ paddingBottom: 'max(env(safe-area-inset-bottom), 24px)' }}
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
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
