'use client';

// 어느 화면에서든 항상 처리해야 하는 네이티브 메시지(뒤로가기 등)를 받는 전역 리스너 — 루트 레이아웃에 마운트
import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';

import { decideBack } from '@/shared/bridge/backNavigation';
import { postToNative, subscribeFromNative } from '@/shared/bridge/web-bridge';
import { BottomSheet } from '@/shared/ui/BottomSheet';
import { Button } from '@/shared/ui/Button';

export const BridgeListener = () => {
  const pathname = usePathname();
  const [exitOpen, setExitOpen] = useState(false);

  useEffect(() => {
    const handleBackPressed = () => {
      const navigation = (window as { navigation?: { canGoBack?: boolean } })
        .navigation;
      const decision = decideBack(pathname, Boolean(navigation?.canGoBack));

      if (decision === 'exit-confirm') setExitOpen(true);
      else if (decision === 'history-back') window.history.back();
      else postToNative({ type: 'EXIT_APP' });
    };

    return subscribeFromNative((message) => {
      if (message.type === 'BACK_PRESSED') handleBackPressed();
    });
  }, [pathname]);

  return (
    <BottomSheet open={exitOpen} onClose={() => setExitOpen(false)}>
      <h2 className="text-[17px] font-bold text-foreground">
        앱을 종료할까요?
      </h2>
      <p className="mt-2 text-sm leading-6 text-muted-foreground">
        홈에서 뒤로가기를 누르면 앱이 종료돼요.
      </p>
      <div className="mt-5 grid grid-cols-2 gap-2">
        <Button
          variant="ghost"
          size="md"
          onClick={() => postToNative({ type: 'EXIT_APP' })}
        >
          종료하기
        </Button>
        <Button size="md" onClick={() => setExitOpen(false)}>
          계속하기
        </Button>
      </div>
    </BottomSheet>
  );
};
