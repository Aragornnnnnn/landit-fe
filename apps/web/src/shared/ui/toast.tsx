'use client';

// 전역 토스트 — showToast()로 어디서든 짧은 안내를 띄운다. Toaster는 루트 레이아웃에 하나만 마운트
import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';

import { useKeyboardInset } from '@/shared/lib/useKeyboardInset';

// 노출 시간 — 종료 재입력 대기(BridgeListener) 등 외부 타이머와 맞출 때 참조한다
export const TOAST_MS = 2000;

let listener: ((message: string) => void) | null = null;

// 컴포넌트 밖(훅·이벤트 핸들러)에서도 호출 가능. Toaster가 없으면 조용히 무시된다(테스트 등)
export const showToast = (message: string) => listener?.(message);

export const Toaster = () => {
  const [toast, setToast] = useState<{
    id: number;
    message: string;
    shownAt: number;
  } | null>(null);
  // 웹뷰는 키보드가 올라와도 화면 아래가 그대로라 토스트가 키보드 뒤에 숨는다 — 키보드 위로 올린다
  const keyboardInset = useKeyboardInset();

  useEffect(() => {
    // 같은 안내가 떠 있으면 새로 그리지 않고 떠 있는 시간만 늘린다 — 새로 그리면 사라졌다 나타나며 번쩍인다
    listener = (message) =>
      setToast((current) =>
        current?.message === message
          ? { ...current, shownAt: Date.now() }
          : { id: Date.now(), message, shownAt: Date.now() },
      );
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
    // 모달·시트(z-50)보다 위에 — 같은 층이면 나중에 붙는 포털에 가려 딤 뒤로 가라앉는다
    <div
      style={keyboardInset > 0 ? { bottom: keyboardInset + 16 } : undefined}
      className="pointer-events-none fixed bottom-[max(var(--safe-area-inset-bottom),24px)] left-1/2 z-[60] -translate-x-1/2"
    >
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
