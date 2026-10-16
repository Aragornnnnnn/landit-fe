// 공통 바텀 시트 — 오버레이 + 슬라이드업 패널, 웹 너비 자동 대응. 스크린 리더는 BottomSheet.Title을 시트 이름으로 읽는다
'use client';

import { createContext, use, useId, type ComponentProps } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { createPortal } from 'react-dom';

import { useDialogLayer } from './useDialogLayer';

// 시트 제목의 id — 시트가 aria-labelledby로 가리킨다
const SheetTitleIdContext = createContext<string | undefined>(undefined);

interface BottomSheetProps {
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
}

export function BottomSheet({ open, onClose, children }: BottomSheetProps) {
  const { mounted, panelRef } = useDialogLayer({
    open,
    dismissible: true,
    onClose,
  });
  const titleId = useId();

  if (!mounted) return null;

  return createPortal(
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            data-testid="bottom-sheet-dim"
            className="fixed inset-0 z-50 bg-black/40"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <motion.div
            ref={panelRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            tabIndex={-1}
            className="fixed bottom-0 left-1/2 z-50 w-full max-w-[430px] -translate-x-1/2 rounded-t-3xl bg-white px-6 pt-6 outline-none"
            style={{
              paddingBottom: 'max(var(--safe-area-inset-bottom), 24px)',
            }}
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 28, stiffness: 300 }}
          >
            <SheetTitleIdContext value={titleId}>
              {children}
            </SheetTitleIdContext>
          </motion.div>
        </>
      )}
    </AnimatePresence>,
    document.body,
  );
}

// 시트 제목 — 모양은 쓰는 쪽이 정하고, 여기서는 시트 이름으로 이어 주기만 한다
const SheetTitle = (props: Omit<ComponentProps<'h2'>, 'id'>) => (
  <h2 {...props} id={use(SheetTitleIdContext)} />
);

BottomSheet.Title = SheetTitle;
