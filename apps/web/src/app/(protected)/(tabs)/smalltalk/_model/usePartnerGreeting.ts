// 스몰톡 홈의 인사 — 고른 상대가 자기소개를 하고, 그동안의 자세·표정이 함께 정해진다.
// 상대·인사·표정이 늘 같이 움직여서 한 훅에 묶는다 — 하나만 바꾸면 나머지가 어긋난다
'use client';

import { useEffect, useState } from 'react';

import type {
  CharacterLook,
  Partner,
} from '@/features/conversation/model/character-look';
import { useAiSpeech } from '@/features/conversation/model/useAiSpeech';
import {
  DEFAULT_PARTNER,
  findPartner,
} from '@/features/small-talk/model/partner';

// 인사 첫머리만 웃는 얼굴 — 말하는 내내 웃고 있으면 표정이 아니라 그림이 된다
const GREETING_SMILE_MS = 2000;

/** greetsOnMount는 첫 렌더에서만 읽는다 — 안내를 이미 본 기기는 들어오자마자 인사가 시작된다 */
export const usePartnerGreeting = ({
  greetsOnMount,
}: {
  greetsOnMount: boolean;
}) => {
  const [partnerId, setPartnerId] = useState<Partner>(DEFAULT_PARTNER);
  // 안내를 닫은 뒤 상대가 자기소개를 한다. 상대를 바꾸면 새로 고른 사람이 다시 말한다
  const [greeting, setGreeting] = useState(greetsOnMount);
  // 웃는 얼굴은 인사보다 짧게 스친다 — 발화가 끝나기 전에 평소 표정으로 돌아온다.
  // 참/거짓 대신 인사 횟수를 세는 이유 — 웃는 중에 상대를 바꾸면 참을 다시 넣어도 값이 그대로라
  // 타이머가 안 걸리고 앞 인사의 남은 시간만 쓰게 된다
  const [smileCount, setSmileCount] = useState(greetsOnMount ? 1 : 0);
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
    content: partner.intro,
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

  const selectPartner = (next: Partner) => {
    setPartnerId(next);
    greet();
  };

  return { partner, look, speech, greet, selectPartner };
};
