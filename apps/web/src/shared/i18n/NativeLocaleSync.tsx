'use client';

// 지금 화면 언어를 셸에 알린다 — 셸은 알람 버튼·위젯·오류 화면 같은 셸 문구를 이 언어로 그린다. 루트 레이아웃에 마운트
import { useEffect } from 'react';
import { useLocale } from 'next-intl';

import { getNativeContext } from '@/shared/bridge/native-context';
import { postToNative } from '@/shared/bridge/web-bridge';

import type { Locale } from './locale';

// SET_LOCALE을 아는 셸부터 보낸다 — 구 셸은 모르는 메시지를 경고로 남기고 버린다
const SET_LOCALE_BRIDGE_VERSION = 14;

export const NativeLocaleSync = () => {
  const locale = useLocale() as Locale;

  useEffect(() => {
    const context = getNativeContext();
    if (!context || context.bridgeVersion < SET_LOCALE_BRIDGE_VERSION) return;
    postToNative({ type: 'SET_LOCALE', locale });
  }, [locale]);

  return null;
};
