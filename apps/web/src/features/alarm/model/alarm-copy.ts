'use client';

// 알람 문구 — 환급 참여자에게는 환급 톤, 그 밖에는 "매일 챙겨 드리는" 톤. 등록 흐름이 받은 reward로 고르고 안쪽 화면은 useAlarmCopy로 읽는다
import { createContext, use, type ReactNode } from 'react';
import { useTranslations } from 'next-intl';

import { lineBreak } from '@/shared/i18n/rich';
import type { Translator } from '@/shared/i18n/translator';

export interface AlarmCopy {
  introTitle: ReactNode;
  pledgeClosing: string;
  settingsDescription: string;
}

// 환급 톤은 한국어 화면에만 있어 옮기지 않는다
const REWARD_COPY: AlarmCopy = {
  introTitle: '성공적인 환급을 위해\n매일 알람을 맞춰 봐요',
  pledgeClosing: '영어 공부해서\n꼭 환급받겠습니다!',
  settingsDescription: '환급을 놓치지 않도록 약속한 시간에 알려드릴게요',
};

export const alarmCopy = (
  rewardParticipant: boolean,
  t: Translator<'alarm'>,
): AlarmCopy =>
  rewardParticipant
    ? REWARD_COPY
    : {
        introTitle: t.rich('intro.title', lineBreak),
        pledgeClosing: t('pledge.closingTitle'),
        settingsDescription: t('screen.description'),
      };

/** 환급 참여자인가 — 등록 흐름이 정해 두면 안쪽 화면이 그 톤으로 읽는다 */
export const AlarmRewardContext = createContext(false);

export const useAlarmCopy = () =>
  alarmCopy(use(AlarmRewardContext), useTranslations('alarm'));
