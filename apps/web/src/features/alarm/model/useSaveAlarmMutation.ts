'use client';

// 알람 저장 — 시각·켜짐을 서버에 저장한다. 삭제는 켜짐을 끄는 저장이다(시각은 남겨 다시 등록할 때 기본값으로 쓴다).
// 저장하면 AlarmSync가 셸 예약을 맞춘다
import type { AlarmTime } from '@landit/bridge';
import { useMutation, useQueryClient } from '@tanstack/react-query';

import { useAuthStore } from '@/shared/auth/auth-store';
import { showToast } from '@/shared/ui/toast';

import { updateMyAlarm } from '../api/alarm';
import { toServerTime } from './alarm-time';
import { alarmKeys } from './keys';

export interface AlarmDraft {
  time: AlarmTime;
  enabled: boolean;
}

export const useSaveAlarmMutation = () => {
  const queryClient = useQueryClient();
  const userId = useAuthStore((state) => state.member?.userId ?? null);

  return useMutation({
    // 저장이 겹치면 늦게 온 앞 응답이 뒤 값을 덮는다 — 같은 scope는 순서대로 하나씩 보낸다
    scope: { id: 'alarm-save' },
    mutationFn: ({ time, enabled }: AlarmDraft) =>
      updateMyAlarm({ time: toServerTime(time), enabled }),
    onSuccess: (saved) => {
      queryClient.setQueryData(alarmKeys.mine(userId), saved);
    },
    // 실패는 여기서 알린다 — 저장 직후 화면을 떠나면 호출부 콜백은 불리지 않아 조용히 사라진다
    onError: (_, { enabled }) =>
      showToast(
        enabled
          ? '알람을 저장하지 못했어요. 다시 시도해 주세요'
          : '알람을 삭제하지 못했어요. 다시 시도해 주세요',
      ),
  });
};
