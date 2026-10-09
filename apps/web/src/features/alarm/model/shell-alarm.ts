'use client';

// 셸 알람 공통 값 — 알람 메시지를 알아듣는 셸인지, 시나리오 알람의 제목과 갈 화면
import { getNativeContext } from '@/shared/bridge/native-context';
import { SCENARIO_PATH } from '@/shared/lib/routes';

// 알람 메시지를 알아듣는 최소 브릿지 버전
const ALARM_BRIDGE_VERSION = 8;

// 웹이 거는 알람의 종류 — 지금은 시나리오 알람 하나
export const ALARM_TYPE = 'scenario';

// 잠금 화면 알람 제목 — 걸린 알람은 건 순간의 제목을 들고 있어서 바뀌는 값을 넣지 않는다
export const ALARM_TITLE = '오늘의 시나리오 할 시간!';

// "대화하러 가기"를 누르면 갈 화면
export const ALARM_PATH = SCENARIO_PATH;

export const isAlarmShell = () => {
  const context = getNativeContext();
  return context !== null && context.bridgeVersion >= ALARM_BRIDGE_VERSION;
};
