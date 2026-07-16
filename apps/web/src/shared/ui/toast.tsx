'use client';

// 전역 토스트 — showToast()로 어디서든 짧은 안내를 띄운다. Toaster는 루트 레이아웃에 하나만 마운트
import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';

// 노출 시간 — 종료 재입력 대기(BridgeListener) 등 외부 타이머와 맞출 때 참조한다
export const TOAST_MS = 2000;

let listener: ((message: string) => void) | null = null;

// 컴포넌트 밖(훅·이벤트 핸들러)에서도 호출 가능. Toaster가 없으면 조용히 무시된다(테스트 등)
export const showToast = (message: string) => listener?.(message);

export const Toaster = () => {
  const [toast, setToast] = useState<{ id: number; message: string } | null>(
    null,
  );

  useEffect(() => {
    listener = (message) => setToast({ id: Date.now(), message });
    return () => {
      listener = null;
    };
  }, []);

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(null), TOAST_MS);
    return () => clearTimeout(timer);
  }, [toast]);

  return (
    // 센터링은 바깥 div가 맡는다 — motion이 주입하는 transform(y)이 -translate-x-1/2를 덮어쓰지 않게
    <div className="pointer-events-none fixed bottom-[max(env(safe-area-inset-bottom),24px)] left-1/2 z-50 -translate-x-1/2">
      <AnimatePresence>
        {toast && (
          <motion.div
            key={toast.id}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <p className="rounded-full bg-foreground/90 px-4 py-2.5 text-sm font-semibold whitespace-nowrap text-background">
              {toast.message}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
