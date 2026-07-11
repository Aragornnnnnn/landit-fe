'use client';

// 앱 전역 Provider — 싱글턴 React Query 클라이언트를 앱에 연결한다 (생성·설정은 lib/query-client)
import { QueryClientProvider } from '@tanstack/react-query';

import { getQueryClient } from '@/shared/lib/query-client';

export const Providers = ({ children }: { children: React.ReactNode }) => {
  return (
    <QueryClientProvider client={getQueryClient()}>
      {children}
    </QueryClientProvider>
  );
};
