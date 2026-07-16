// 마이크 권한 요청 훅 — 거부해도 에러 없이 종료한다
'use client';

import { useState } from 'react';
import { EVENTS } from '@landit/analytics';

import { track } from '@/shared/analytics';

export const useMicPermission = () => {
  const [requesting, setRequesting] = useState(false);

  const request = async () => {
    setRequesting(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach((mediaTrack) => mediaTrack.stop());
      track(EVENTS.MIC_PERMISSION_DECIDED, {
        granted: true,
        source: 'onboarding',
      });
    } catch {
      // 거부여도 그대로 진행한다
      // TODO: 영구 차단 상태에선 프롬프트 없이 즉시 거부된다 — 대화 진입 시 설정 안내 필요
      // TODO: WebView 셸에선 셸의 onPermissionRequest/decideMediaCapturePermissions 설정이 선행돼야 시스템 창이 뜬다
      track(EVENTS.MIC_PERMISSION_DECIDED, {
        granted: false,
        source: 'onboarding',
      });
    }
    setRequesting(false);
  };

  return { requesting, request };
};
