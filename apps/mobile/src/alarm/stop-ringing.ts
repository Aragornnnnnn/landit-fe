// 울림 끄기 — 알람으로 앱이 열려도 라이브러리는 소리를 끄지 않아서 앱이 끈다
import { Platform } from 'react-native';

import {
  AlarmScheduler,
  type AlarmAction,
} from '../../modules/alarm-scheduler';

// 라이브러리는 알람 버튼이 눌린 기록을 handoff라고 부른다
const stop = async (pressed: AlarmAction) => {
  // "끄기"로 연 건 이미 멈췄다
  if (pressed.action === 'nativeStop') return;
  if (Platform.OS === 'android') {
    await AlarmScheduler.completeNativeAlarmAsync(pressed.alarmId);
    return;
  }
  // iOS는 이번 회차만 끝낸다 — 알람 id로 끝내면 반복 알람이 통째로 지워진다.
  // 회차 id는 응답에 있지만 라이브러리 타입에 빠져 있어 직접 꺼낸다
  const { occurrenceId } = pressed as { occurrenceId?: string };
  if (!occurrenceId) return;
  await AlarmScheduler.resolveAlarmOccurrenceAsync(occurrenceId, {
    outcome: 'completed',
  });
};

// 알람으로 앱이 열렸으면 울림을 끈다. "대화하러 가기"로 열렸으면 그 알람 id를 돌려준다.
// Android가 울리기 시작할 때 남긴 기록(trigger)으로는 버튼을 눌렀는지 알 수 없어 null — Android 버튼은 알람 링크로 안다
export const stopRingingIfOpenedByAlarm = async () => {
  const pressed = await AlarmScheduler.getPendingNativeAlarmHandoffAsync();
  if (!pressed) return null;
  try {
    await stop(pressed);
  } finally {
    // 끄기가 실패해도 기록은 지운다 — 남겨 두면 열 때마다 같은 오류가 난다
    await AlarmScheduler.clearPendingNativeAlarmHandoffAsync();
  }
  const openedByButton = pressed.action === 'secondaryOpen' && !pressed.trigger;
  return openedByButton ? pressed.alarmId : null;
};

// 앱이 떠 있을 때 누른 알람 버튼은 이벤트로 받는다.
// Android는 울리기 시작할 때도 같은 이벤트(trigger)를 보내는데, 그걸로 끄면 울리자마자 꺼지니 무시한다
export const onAlarmButtonPressed = (listener: () => void) =>
  AlarmScheduler.addListener('onAlarmAction', (action: AlarmAction) => {
    if (action.trigger) return;
    listener();
  });
