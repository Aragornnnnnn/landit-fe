// 앱 업데이트 체크 게이트 — updateType에 따라 강제 모달·소프트 시트·아무것도 그리지 않음을 고른다
'use client';

import { useState } from 'react';

import { useAppUpdateCheck } from '@/features/app-update/model/useAppUpdateCheck';
import { ForceUpdateModal } from '@/features/app-update/ui/ForceUpdateModal';
import { SoftUpdateSheet } from '@/features/app-update/ui/SoftUpdateSheet';

export const AppUpdateGate = () => {
  const { updateType, reason } = useAppUpdateCheck();
  const [dismissed, setDismissed] = useState(false);

  if (updateType === 'FORCE') return <ForceUpdateModal reason={reason} />;
  if (updateType === 'SOFT' && !dismissed) {
    return (
      <SoftUpdateSheet reason={reason} onClose={() => setDismissed(true)} />
    );
  }
  return null;
};
