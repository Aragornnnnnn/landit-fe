'use client';

// 셸 알람 공통 값 — 알람 메시지를 알아듣는 셸인지, 시나리오 알람의 갈 화면. 제목은 화면 언어 문구(alarm.lockScreen.title)
import { SCENARIO_ALARM_UTM } from '@/shared/analytics/utm';
import { getNativeContext } from '@/shared/bridge/native-context';
import { SCENARIO_PATH } from '@/shared/lib/routes';

// 알람 메시지를 알아듣는 최소 브릿지 버전
const ALARM_BRIDGE_VERSION = 8;

// 웹이 거는 알람의 종류 — 지금은 시나리오 알람 하나
export const ALARM_TYPE = 'scenario';

// "대화하러 가기"를 누르면 갈 화면 — 유입 딱지를 달아 알람으로 들어온 것을 첫 페이지뷰가 알아본다.
// 값이 바뀌면 이미 걸린 알람은 앱을 열 때 새 주소로 다시 걸린다
export const ALARM_PATH = `${SCENARIO_PATH}?${SCENARIO_ALARM_UTM}`;

export const isAlarmShell = () => {
  const context = getNativeContext();
  return context !== null && context.bridgeVersion >= ALARM_BRIDGE_VERSION;
};

// 권한 체계가 플랫폼마다 달라 안내도 갈린다 — 셸 밖(브라우저)은 iOS로 본다
export const alarmPlatform = (): 'ios' | 'android' =>
  getNativeContext()?.platform === 'android' ? 'android' : 'ios';
