// 기존 유저 영어 수준 강제 체크 — 온보딩은 이미 마쳤지만 아직 답하지 않은 유저에게 앱 진입 시 무조건 묻는다.
// 신규 유저는 온보딩의 level 스텝에서 이미 답하고 오므로 여기서 다시 뜨지 않는다
'use client';

import { useEffect, useState } from 'react';
import { EVENTS, type EnglishLevel } from '@landit/analytics';

import { track } from '@/shared/analytics';
import { hasSeenOnboarding } from '@/shared/auth/onboarding-seen';
import { Button } from '@/shared/ui/Button';

import {
  hasAnsweredEnglishLevel,
  markEnglishLevelAnswered,
} from '../model/english-level';
import { EnglishLevelOptions } from './common/EnglishLevelOptions';

export const EnglishLevelGate = () => {
  const [answered, setAnswered] = useState(hasAnsweredEnglishLevel);
  const [selected, setSelected] = useState<EnglishLevel | null>(null);

  // 온보딩을 아직 안 거친 유저는 온보딩 쪽 level 스텝에서 곧 물으니 여기서는 막지 않는다
  const visible = !answered && hasSeenOnboarding();

  useEffect(() => {
    if (visible) track(EVENTS.ENGLISH_LEVEL_GATE_VIEWED);
  }, [visible]);

  if (!visible) return null;

  const confirm = () => {
    if (!selected) return;
    markEnglishLevelAnswered(selected);
    track(EVENTS.ENGLISH_LEVEL_GATE_ANSWERED, { level: selected });
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
      <h1 className="pt-10 text-3xl leading-[1.18] font-black tracking-normal">
        영어를 얼마나
        <br />
        알고 계시나요?
      </h1>
      <p className="mt-4 text-xl font-bold text-muted-foreground">
        답변에 맞춰 대화 난이도를 준비할게요
      </p>

      <div className="mt-8 flex flex-1 flex-col overflow-y-auto">
        <EnglishLevelOptions selected={selected} onSelect={setSelected} />
      </div>

      <Button disabled={selected === null} onClick={confirm}>
        선택했어요!
      </Button>
    </main>
  );
};
