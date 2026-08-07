// 캐릭터 무대 — 대화 상대가 마주 서 있는 상단 섹션. 속마음 연출은 ThoughtOverlay가 전면에서 담당한다.
'use client';

import { motion } from 'motion/react';

import type { CharacterLook, Partner } from '../../model/character-look';
import type { PlayingSpeech } from '../../model/useAiSpeech';
import { PartnerCharacter } from '../character/PartnerCharacter';

/**
 * partner는 세션 TTS 음성 성별을 따르고, look은 대화 단계에 맞춘 자세와 표정,
 * speech는 재생 중인 발화로 입모양을 소리에 맞추는 데 쓴다. 셋 다 그대로 캐릭터에 넘긴다.
 */
interface CharacterStageProps {
  partner: Partner;
  look: CharacterLook;
  speech: PlayingSpeech | null;
}

export const CharacterStage = ({
  partner,
  look,
  speech,
}: CharacterStageProps) => (
  // 무대는 명확한 한 섹션 — 상태바 밑까지 이어지되 safe area만큼 키워서 캐릭터는 항상 인셋 아래에 선다
  // 캐릭터 에셋 배경을 앱 배경색(bg-background)에 맞춰 둬서 무대도 같은 색 — 배경이 이음매 없이 이어진다
  // 높이 고정 — 텍스트가 길어져도 무대는 그대로 두고, 질문/답변이 각자 칸 안에서 스크롤된다
  // 작은 화면에선 질문 자리가 부족하지 않게 상한만 뷰포트에 맞춘다(대화 중엔 변하지 않는 기기별 고정값)
  <div
    className="relative flex w-full flex-none items-end justify-center overflow-hidden rounded-b-3xl border-b border-border bg-background shadow-lg shadow-black/5"
    style={{
      height: 'calc(min(17rem, 34dvh) + max(env(safe-area-inset-top), 8px))',
    }}
  >
    <motion.div
      initial={{ y: 24, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.35, ease: 'easeOut' }}
      className="relative flex h-full items-end justify-center"
    >
      {/* 상체 — 무대와 같은 배경색째로 얹혀 마주 서 있는 구도. 작은 무대에선 머리가 잘리지 않게 무대 높이에 맞춰 담는다 */}
      <div className="h-full max-h-64">
        <PartnerCharacter partner={partner} look={look} speech={speech} />
      </div>
    </motion.div>
  </div>
);
