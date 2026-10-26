'use client';

// 고치기 첫 안내를 띄울지 정하는 훅 — 처음 만난 확인 화면에서만 띄우고, 한 번 사라지면 본 것으로 남긴다.
// 사라지는 까닭(보내기·다시 말하기·수정·나가기)은 가리지 않는다 — 어느 쪽이든 그 화면을 한 번 지나간 것이다
import { useEffect, useRef } from 'react';

import { useSeenFlag } from '@/shared/lib/useSeenFlag';

import { editHintSeen } from './edit-hint-seen';

export const useEditHint = (active: boolean) => {
  const seen = useSeenFlag(editHintSeen);
  const visible = active && !seen;
  const shownRef = useRef(false);

  useEffect(() => {
    if (visible) {
      shownRef.current = true;
      return;
    }
    if (shownRef.current) editHintSeen.mark();
  }, [visible]);

  return visible;
};
