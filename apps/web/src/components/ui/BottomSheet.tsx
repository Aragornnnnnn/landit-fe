// 공통 바텀 시트 — 오버레이 + 슬라이드업 패널, 웹 너비 자동 대응
'use client';

import { AnimatePresence, motion } from 'motion/react';
import { createPortal } from 'react-dom';

import { useClientOnlyValue } from '@/hooks/useClientOnlyValue';

interface BottomSheetProps {
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
}

export function BottomSheet({ open, onClose, children }: BottomSheetProps) {
  const mounted = useClientOnlyValue(() => true, false);
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
