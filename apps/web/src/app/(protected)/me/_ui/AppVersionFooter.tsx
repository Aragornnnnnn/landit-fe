'use client';

// 마이페이지 맨 아래 앱 버전 — 셸이 넘겨 준 버전·빌드 번호를 작은 회색 글자로 보여 주고, 브라우저에서는 그리지 않는다
import { useNativeContext } from '@/shared/bridge/useNativeContext';

export const AppVersionFooter = () => {
  const nativeContext = useNativeContext();
  if (!nativeContext) return null;

  const { appVersion, buildNumber } = nativeContext;
  return (
    <p className="text-center text-[12px]" style={{ color: '#6b7280' }}>
      앱 버전 {appVersion}
      {buildNumber && ` (${buildNumber})`}
    </p>
  );
};
