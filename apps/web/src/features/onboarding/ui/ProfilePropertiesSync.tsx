'use client';

// 학습 수준·배울 영어를 앰플리튜드 유저 속성으로 올리는 무렌더 컴포넌트 — 루트 레이아웃에 마운트
import { useEffect } from 'react';

import { setUserProperties } from '@/shared/analytics';
import { useAuthStore } from '@/shared/auth/auth-store';

import { toEnglishLevel } from '../model/english-level';
import { useAccentQuery } from '../model/useAccentQuery';
import { useLearningLevelQuery } from '../model/useLearningLevelQuery';

/**
 * 도착한 값부터 각각 올린다 — 앰플리튜드 유저 속성은 키마다 따로 최신값을 들고 있어
 * 한쪽 조회가 실패해도 다른 쪽까지 묶여 빠지면 안 된다.
 *
 * 조회에 실패하면 그 속성은 건드리지 않는다. 구독과 달리 수준·배울 영어는 저절로 만료되지 않아
 * 지난 세션에 올려 둔 값이 여전히 맞다 — 유료 여부처럼 "아직 모름"으로 지울 이유가 없다
 */
export const ProfilePropertiesSync = () => {
  const userId = useAuthStore((state) => state.member?.userId ?? null);
  const { data: level } = useLearningLevelQuery();
  const { data: accent } = useAccentQuery();

  useEffect(() => {
    if (userId === null || !level) return;
    setUserProperties({ learning_level: toEnglishLevel(level.learningLevel) });
  }, [userId, level]);

  useEffect(() => {
    if (userId === null || !accent) return;
    setUserProperties({ accent_locale: accent.accentLocale });
  }, [userId, accent]);

  return null;
};
