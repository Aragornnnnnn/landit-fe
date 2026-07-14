// 캐릭터 무대 — 대화 상대가 마주 서 있는 상단 섹션. 속마음 연출은 ThoughtOverlay가 전면에서 담당한다.
'use client';

import { motion } from 'motion/react';

interface CharacterStageProps {
  thumbnailUrl: string | null; // 시나리오 장면 이미지 (없으면 단색 패널)
  partner: 'male' | 'female'; // 상대 캐릭터 — 세션 TTS 음성 성별을 따른다
}

export const CharacterStage = ({
  thumbnailUrl,
  partner,
}: CharacterStageProps) => (
  // 무대는 명확한 한 섹션 — 상태바 밑까지 이어지되 safe area만큼 키워서 캐릭터는 항상 인셋 아래에 선다
  // 캐릭터 에셋이 흰 배경을 품고 있어 무대도 흰색 — 배경이 이음매 없이 이어진다
  <div
    className="relative flex w-full flex-none items-end justify-center overflow-hidden rounded-b-3xl border-b border-border bg-white shadow-lg shadow-black/5"
    style={{ height: 'calc(17rem + max(env(safe-area-inset-top), 8px))' }}
  >
    {/* 장면 이미지는 썸네일이 있을 때만 패널을 채운다 */}
    {thumbnailUrl && (
      // eslint-disable-next-line @next/next/no-img-element -- 백엔드 썸네일 도메인이 미정이라 next/image 원격 허용 목록을 아직 못 만든다
      <img
        src={thumbnailUrl}
        alt=""
        className="absolute inset-0 h-full w-full object-cover"
      />
    )}

    <motion.div
      initial={{ y: 24, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.35, ease: 'easeOut' }}
      className="relative flex h-full items-end justify-center"
    >
      {/* 상체 — 흰 배경째로 무대에 얹혀 마주 서 있는 구도. safe area와 무관하게 높이 고정. Rive 캐릭터로 교체 예정 */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={`/images/character/partner-${partner}.webp`}
        alt=""
        className="h-64 object-contain"
      />
    </motion.div>
  </div>
);
