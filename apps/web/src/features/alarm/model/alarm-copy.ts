'use client';

// 알람 문구 — 환급 참여자에게는 환급 톤, 그 밖에는 "매일 챙겨 드리는" 톤. 등록 흐름이 받은 refund로 고르고 안쪽 화면은 useAlarmCopy로 읽는다
import { createContext, use } from 'react';

export interface AlarmCopy {
  introTitle: string;
  pledgeClosing: string;
  settingsDescription: string;
}

const DEFAULT_COPY: AlarmCopy = {
  introTitle: '매일 알람으로\n영어 습관 만들어 드릴게요',
  pledgeClosing: '영어 공부를 하겠습니다!',
  settingsDescription: '매일 약속한 시간에 알려드릴게요',
};

const REFUND_COPY: AlarmCopy = {
  introTitle: '성공적인 환급을 위해\n매일 알람을 맞춰 봐요',
  pledgeClosing: '영어 공부해서\n꼭 환급받겠습니다!',
  settingsDescription: '환급을 놓치지 않도록 약속한 시간에 알려드릴게요',
};

export const alarmCopy = (refund: boolean) =>
  refund ? REFUND_COPY : DEFAULT_COPY;

export const AlarmCopyContext = createContext<AlarmCopy>(DEFAULT_COPY);

export const useAlarmCopy = () => use(AlarmCopyContext);
