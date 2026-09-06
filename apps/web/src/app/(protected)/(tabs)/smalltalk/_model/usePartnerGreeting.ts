// 스몰톡 홈의 인사 — 캐릭터를 누르면 고른 상대가 자기소개를 하고, 그동안의 자세·표정이 함께 정해진다.
// 저절로 시작하지 않는다 — 소리는 눌러서 듣는 것이라 놀라지 않고, 브라우저의 소리 재생 제약(제스처)도 자연히 푼다.
// 상대·인사·표정이 늘 같이 움직여서 한 훅에 묶는다 — 하나만 바꾸면 나머지가 어긋난다
'use client';

import { useEffect, useState } from 'react';
import { EVENTS } from '@landit/analytics';

import type {
  CharacterLook,
  Partner,
} from '@/features/conversation/model/character-look';
import { useAiSpeech } from '@/features/conversation/model/useAiSpeech';
import {
  DEFAULT_PARTNER,
  findPartner,
} from '@/features/small-talk/model/partner';
import { track } from '@/shared/analytics';

// 인사 첫머리만 웃는 얼굴 — 말하는 내내 웃고 있으면 표정이 아니라 그림이 된다
const GREETING_SMILE_MS = 2000;

export const usePartnerGreeting = () => {
  const [partnerId, setPartnerId] = useState<Partner>(DEFAULT_PARTNER);
  // 캐릭터를 누르면 자기소개를 한다. 끝나면 다시 눌러야 다시 말한다
  const [greeting, setGreeting] = useState(false);
  // 웃는 얼굴은 인사보다 짧게 스친다 — 발화가 끝나기 전에 평소 표정으로 돌아온다.
  // 참/거짓 대신 인사 횟수를 세는 이유 — 웃는 중에 다시 인사하면 참을 다시 넣어도 값이 그대로라
  // 타이머가 안 걸리고 앞 인사의 남은 시간만 쓰게 된다
  const [smileCount, setSmileCount] = useState(0);
  const smiling = smileCount > 0;

  useEffect(() => {
    if (smileCount === 0) return;
    const timer = setTimeout(() => setSmileCount(0), GREETING_SMILE_MS);
    return () => clearTimeout(timer);
  }, [smileCount]);

  const partner = findPartner(partnerId);

  // 자기소개 재생 — 문구가 고정이라 미리 만든 음원을 튼다(합성 왕복 없음).
  // 음원이 없거나 실패하면 훅이 알아서 합성으로 폴백하고, 소리가 나면 입이 소리를 따라간다
  const { speech } = useAiSpeech({
    playing: greeting,
    source: { content: partner.intro },
    voice: partner.voice,
    openingSrc: partner.introAudioSrc,
    onSpeechEnd: () => setGreeting(false),
  });

  // 인사하는 동안은 웃는 눈으로 — 처음 마주치는 얼굴이라 반가운 쪽이 낫다
  const look: CharacterLook = {
    posture: greeting ? 'speaking' : 'idle',
    expression: smiling ? 'happy' : 'neutral',
  };

  const greet = () => {
    setGreeting(true);
    setSmileCount((count) => count + 1);
  };

  // 인사와 웃음은 짝이다 — 멈출 땐 둘 다 멈춰야 새 상대에게 앞 사람의 웃음 타이머가 남지 않는다
  const stopGreeting = () => {
    setGreeting(false);
    setSmileCount(0);
  };

  // 상대를 바꾸면 새 상대는 서 있기만 한다 — 하던 인사는 멈춘다.
  // 안 멈추면 바뀐 문구로 재생 훅이 곧장 새 인사를 시작해 "저절로 말하는" 셈이 된다
  const selectPartner = (next: Partner) => {
    // 이미 고른 상대를 다시 눌러도 선택은 아니다 — 하던 인사만 멈춘다
    if (next !== partnerId) {
      track(EVENTS.SMALL_TALK_PARTNER_SELECTED, { partner: next });
    }
    setPartnerId(next);
    stopGreeting();
  };

  return { partner, look, speech, greet, selectPartner };
};
