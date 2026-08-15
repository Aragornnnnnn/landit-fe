// iOS / Android 마이크 권한 요청 UI 미리보기 (인터랙션 없음)
'use client';

import { useClientOnlyValue } from '@/shared/lib/useClientOnlyValue';

export const PermissionPreview = () => {
  const isAndroid = useClientOnlyValue(
    () => /Android/i.test(navigator.userAgent),
    false,
  );

  if (isAndroid) return <AndroidPermissionPreview />;
  return <IosPermissionPreview />;
};

// iOS 시스템 권한 다이얼로그 모사 — 파란색은 iOS 시스템 틴트 리터럴
const IosPermissionPreview = () => {
  return (
    <div className="relative mx-auto w-[310px] overflow-visible">
      <div className="overflow-hidden rounded-2xl border border-border bg-secondary">
        <div className="px-5 pt-6 pb-5 text-center">
          <div className="space-y-2">
            <p className="text-[19px] leading-snug font-semibold">
              &lsquo;Landit&rsquo;이(가)
              <br />
              마이크에 접근하려고 합니다.
            </p>
            <p className="text-sm leading-snug text-muted-foreground">
              음성 답변을 듣고 대화를 이어가기 위해 필요합니다.
            </p>
          </div>
        </div>
        <div className="grid h-13 grid-cols-2 border-t border-border text-lg">
          <div className="flex items-center justify-center border-r border-border text-[#007AFF] opacity-60">
            허용 안 함
          </div>
          <div className="flex items-center justify-center font-semibold text-[#007AFF]">
            허용
          </div>
        </div>
      </div>
      <span className="tossface pointer-events-none absolute right-[45px] -bottom-9 text-[40px] leading-none">
        👆
      </span>
    </div>
  );
};

// Android 시스템 권한 다이얼로그 모사 — 색상은 OS UI 리터럴
const AndroidPermissionPreview = () => {
  return (
    <div className="relative mx-auto w-full max-w-[326px]">
      <div className="rounded-[30px] bg-white px-6 pt-6 pb-5 text-center text-[#202124]">
        <svg
          className="mx-auto mb-5"
          width="28"
          height="28"
          viewBox="0 0 24 24"
          fill="#4D72F5"
          aria-hidden="true"
        >
          <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3zm5.91-3c-.49 0-.9.36-.98.85C16.52 14.2 14.47 16 12 16s-4.52-1.8-4.93-4.15c-.08-.49-.49-.85-.98-.85-.61 0-1.09.54-1 1.14.49 3 2.89 5.35 5.91 5.78V20c0 .55.45 1 1 1s1-.45 1-1v-2.08c3.02-.43 5.42-2.78 5.91-5.78.1-.6-.39-1.14-1-1.14z" />
        </svg>
        <p className="mx-auto max-w-[264px] text-base leading-snug font-semibold">
          Landit에서 오디오를 녹음하도록 허용하시겠습니까?
        </p>
        <div className="mt-7 space-y-1 text-xl leading-none font-bold">
          <div className="relative flex h-14 w-full items-center justify-center">
            앱 사용 중에만 허용
            <span className="tossface pointer-events-none absolute right-0 text-[34px] leading-none">
              👈
            </span>
          </div>
          <div className="flex h-14 items-center justify-center opacity-40">
            이번만 허용
          </div>
          <div className="flex h-14 items-center justify-center opacity-40">
            허용 안함
          </div>
        </div>
      </div>
    </div>
  );
};
