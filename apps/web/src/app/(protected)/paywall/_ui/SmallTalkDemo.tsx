'use client';

// 스몰톡(프리토킹) 데모 — 친구 셋(클로이·마르코·테디) 중 한 명을 골라, 그 친구의 억양(미국·호주·영국, 토스페이스 국기)으로 주제 없이 자유롭게 대화한다.
// 셋이 나란히 웃고 있고, 고르는 칸이 한 명씩 옮겨 가다 테디에 멈추고, 테디가 말을 걸며(입이 움직인다) 대화가 이어진다
import type { CSSProperties } from 'react';

import type { Partner } from '@/features/conversation/model/character-look';
import { PartnerCharacter } from '@/features/conversation/ui/character/PartnerCharacter';
import { QUIZ_VIEWBOX } from '@/features/expression/model/quiz-partner';
import { Emoji } from '@/shared/ui/emoji';

import { DemoScreen, DemoSlide, type DemoProps } from './DemoScreen';

const SMALLTALK_SCENE = {
  chloe: 0,
  marco: 1,
  teddy: 2,
  talk: 3,
} as const;

/** 스몰톡 친구 — 사는 곳과 억양은 실제 스몰톡 소개와 같다 */
const FRIENDS: { id: Partner; name: string; accent: string; flag: string }[] = [
  { id: 'chloe', name: '클로이', accent: '미국 영어', flag: '🇺🇸' },
  { id: 'marco', name: '마르코', accent: '호주 영어', flag: '🇦🇺' },
  { id: 'teddy', name: '테디', accent: '영국 영어', flag: '🇬🇧' },
];

/** 프리토킹 한 토막 — 테디가 묻고, 내가 답하고, 테디가 이어 묻는다 */
const CHAT = [
  { mine: false, text: 'Any plans for the weekend?' },
  { mine: true, text: "I'm going hiking with my friends!" },
  { mine: false, text: 'Lovely! Which mountain?' },
];

export const SmallTalkDemo = ({ step, width }: DemoProps) => (
  <DemoScreen width={width}>
    {/* 친구 고르기 — 셋이 나란히 웃고 있고, 고른 칸이 옮겨 다니다 테디에 선다 */}
    <DemoSlide shown={step !== SMALLTALK_SCENE.talk}>
      <p className="px-6 pt-6 text-[22px] leading-snug font-bold text-foreground">
        오늘은 누구랑
        <br />
        이야기할까요?
      </p>
      <div className="flex gap-2.5 px-5 pt-6">
        {FRIENDS.map((friend, index) => {
          const chosen = index === Math.min(step, SMALLTALK_SCENE.teddy);
          return (
            <div
              key={friend.id}
              className={`flex min-w-0 flex-1 basis-0 flex-col items-center rounded-3xl border-2 pb-4 transition-[border-color,background-color,scale] duration-300 ${
                chosen
                  ? 'scale-105 border-primary bg-[#fffcf8]'
                  : 'border-[#ebebe8] bg-card'
              }`}
            >
              <div className="flex h-[200px] w-full justify-center overflow-hidden rounded-t-[22px] bg-[linear-gradient(180deg,#fdf1e8,#f7e4d2)] px-1 pt-3">
                <PartnerCharacter
                  partner={friend.id}
                  look={{ posture: 'idle', expression: 'happy' }}
                  speech={null}
                  viewBox={QUIZ_VIEWBOX[friend.id]}
                />
              </div>
              <p className="pt-3 text-lg font-bold text-foreground">
                {friend.name}
              </p>
              <span
                className={`mt-1.5 rounded-full px-2.5 py-1 text-[13px] font-bold transition-colors duration-300 ${
                  chosen
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-[#f0f0ee] text-muted-foreground'
                }`}
              >
                <Emoji>{friend.flag}</Emoji> {friend.accent}
              </span>
            </div>
          );
        })}
      </div>
      <p
        className={`mx-6 mt-8 rounded-2xl bg-primary py-4 text-center text-lg font-bold text-primary-foreground transition-opacity duration-300 ${step === SMALLTALK_SCENE.teddy ? 'opacity-100' : 'opacity-0'}`}
      >
        테디와 대화 시작
      </p>
    </DemoSlide>

    {/* 테디와 자유 대화 — 영국 억양, 시간 제한 없이 */}
    <DemoSlide shown={step === SMALLTALK_SCENE.talk}>
      <div className="flex items-center justify-between px-6 pt-6">
        <p className="text-[22px] font-bold text-foreground">테디와 스몰톡</p>
        <span className="rounded-full bg-[#faf2e9] px-3 py-1 text-sm font-bold text-[#c8641f]">
          <Emoji>🇬🇧</Emoji> 영국 영어
        </span>
      </div>
      <div className="mx-6 mt-4 flex h-[260px] justify-center overflow-hidden rounded-[28px] bg-[linear-gradient(180deg,#fdf1e8,#f7e4d2)] pt-3">
        <PartnerCharacter
          partner="teddy"
          look={{ posture: 'speaking', expression: 'happy' }}
          speech={null}
          viewBox={QUIZ_VIEWBOX.teddy}
        />
      </div>
      <div className="flex flex-col gap-2.5 px-6 pt-4">
        {CHAT.map((line, index) => (
          <p
            key={line.text}
            className={`max-w-[300px] rounded-3xl px-5 py-3 text-[17px] font-bold ${
              line.mine
                ? 'self-end rounded-tr-md bg-primary text-primary-foreground'
                : 'self-start rounded-tl-md bg-[#f0f0ee] text-foreground'
            } ${step === SMALLTALK_SCENE.talk ? 'animate-reveal-up' : ''}`}
            style={{ '--i': 2 + index * 9 } as CSSProperties}
          >
            {line.text}
          </p>
        ))}
      </div>
    </DemoSlide>
  </DemoScreen>
);
