// 기존 유저 영어 수준 강제 체크 — 온보딩은 이미 마쳤지만 아직 답하지 않은 유저에게 홈 탭 진입 시 무조건 묻는다.
// 신규 유저는 온보딩의 level 스텝에서 이미 답하고 오므로 여기서 다시 뜨지 않는다.
// 탭 셸에 심겨 있어 딥링크로 다른 화면에 직행하면 그때는 지나가고, 다음 홈 방문에 막는다
'use client';

import { useEffect, useState } from 'react';
import { EVENTS, type EnglishLevel } from '@landit/analytics';

import { track } from '@/shared/analytics';
import { hasSeenOnboarding } from '@/shared/auth/onboarding-seen';

import {
  hasAnsweredEnglishLevel,
  markEnglishLevelAnswered,
} from '../model/english-level';
import { EnglishLevelForm } from './common/EnglishLevelForm';

export const EnglishLevelGate = () => {
  const [answered, setAnswered] = useState(hasAnsweredEnglishLevel);
  // 게이트가 떠 있는 동안 바뀔 일 없는 값이라 마운트 때 한 번만 읽는다
  const [seenOnboarding] = useState(hasSeenOnboarding);

  // 온보딩을 아직 안 거친 유저는 온보딩 쪽 level 스텝에서 곧 물으니 여기서는 막지 않는다
  const visible = !answered && seenOnboarding;

  useEffect(() => {
    if (visible) track(EVENTS.ENGLISH_LEVEL_GATE_VIEWED);
  }, [visible]);

  if (!visible) return null;

  const confirm = (level: EnglishLevel) => {
    markEnglishLevelAnswered(level);
    track(EVENTS.ENGLISH_LEVEL_GATE_ANSWERED, { level });
    setAnswered(true);
  };

  return (
    <main
      className="fixed inset-0 z-50 mx-auto flex h-dvh max-w-[430px] flex-col overflow-hidden bg-background px-6 text-foreground"
      style={{
        paddingTop: 'max(env(safe-area-inset-top), 24px)',
        paddingBottom: 'max(env(safe-area-inset-bottom), 20px)',
      }}
    >
      <h1 className="pt-10 text-3xl leading-[1.18] font-black tracking-normal break-keep">
        맞춤 학습을 위해
        <br />
        영어를 얼마나 아는지 알려주세요
      </h1>

      <div className="mt-8 flex min-h-0 flex-1 flex-col">
        <EnglishLevelForm onConfirm={confirm} />
      </div>
    </main>
  );
};
