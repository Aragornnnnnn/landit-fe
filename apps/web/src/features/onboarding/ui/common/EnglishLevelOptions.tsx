// 영어 수준 선택지 목록 — 온보딩 스텝·기존 유저 강제 체크·마이페이지 변경이 함께 쓴다.
// 고르면 하이라이트만 되고, 실제 확정은 각 화면의 CTA가 맡는다.
// 카드는 테두리 없는 납작한 흰 카드 + 아래 엣지 — 선택되면 틴트 배경으로 눌려 들어간 채 머문다
'use client';

import type { EnglishLevel } from '@landit/analytics';
import { motion, useReducedMotion } from 'motion/react';

import { Emoji } from '@/shared/ui/emoji';

import { ENGLISH_LEVELS } from '../../model/english-level';

export const EnglishLevelOptions = ({
  selected,
  onSelect,
}: {
  selected: EnglishLevel | null;
  onSelect: (level: EnglishLevel) => void;
}) => {
  const reduced = useReducedMotion() ?? false;

  return (
    <div className="flex flex-col gap-3">
      {ENGLISH_LEVELS.map((item) => {
        const isSelected = selected === item.level;
        return (
          <button
            key={item.level}
            type="button"
            onClick={() => onSelect(item.level)}
            aria-pressed={isSelected}
            className={`flex w-full items-center gap-3 rounded-2xl px-4 py-4 text-left transition-[translate,box-shadow,background-color] duration-75 ${
              isSelected
                ? 'translate-y-[3px] bg-primary/15 shadow-none'
                : 'bg-card shadow-[0_3px_0_var(--border)] active:translate-y-[3px] active:shadow-none'
            }`}
          >
            {/* 토스페이스 숫자 글리프 — 선택되면 살짝 커진 채로 머물러 선택 표시를 겸한다 */}
            <motion.span
              className="w-7 shrink-0 text-center text-2xl leading-none"
              animate={{ scale: isSelected ? 1.25 : 1 }}
              transition={
                reduced ? { duration: 0 } : { duration: 0.2, ease: 'easeOut' }
              }
            >
              <Emoji>{String(item.level)}</Emoji>
            </motion.span>
            <span className="text-base font-extrabold text-foreground">
              {item.label}
            </span>
          </button>
        );
      })}
    </div>
  );
};
