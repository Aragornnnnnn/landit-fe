// 마이페이지 "영어 수준" 진입점 — 지금 값을 보여주고 다시 고를 수 있게 한다
'use client';

import { useState } from 'react';
import { EVENTS, type EnglishLevel } from '@landit/analytics';

import {
  getEnglishLevel,
  markEnglishLevelAnswered,
} from '@/features/onboarding/model/english-level';
import { EnglishLevelForm } from '@/features/onboarding/ui/common/EnglishLevelForm';
import { track } from '@/shared/analytics';
import { BottomSheet } from '@/shared/ui/BottomSheet';

import { MenuButton, MenuGroup } from './Menu';

export const EnglishLevelMenuEntry = () => {
  const [open, setOpen] = useState(false);

  const confirm = (level: EnglishLevel) => {
    markEnglishLevelAnswered(level);
    track(EVENTS.ENGLISH_LEVEL_CHANGED, { level });
    setOpen(false);
  };

  return (
    <>
      <MenuGroup>
        <MenuButton title="영어 실력 변경하기" onClick={() => setOpen(true)} />
      </MenuGroup>

      <BottomSheet open={open} onClose={() => setOpen(false)}>
        {/* 작은 화면에서 시트가 화면을 벗어나지 않게 높이를 묶고, 넘치면 선택지만 안에서 스크롤된다 */}
        <div className="flex max-h-[75dvh] flex-col">
          <h2 className="text-[17px] font-bold" style={{ color: '#111' }}>
            영어 실력을 다시 골라주세요
          </h2>
          <p
            className="mt-1 mb-5 text-[14px] leading-6"
            style={{ color: '#666' }}
          >
            실력에 맞춰 학습을 준비해드릴게요
          </p>
          {/* 시트를 다시 열면 그때의 저장값이 미리 골라진 채 열린다 — 닫힘 동안 언마운트라 key 없이도 초기화된다 */}
          {open && (
            <EnglishLevelForm initial={getEnglishLevel()} onConfirm={confirm} />
          )}
        </div>
      </BottomSheet>
    </>
  );
};
