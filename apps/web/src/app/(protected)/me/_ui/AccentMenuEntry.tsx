// 마이페이지 "배울 영어" 진입점 — 지금 값을 보여주고 다시 고를 수 있게 한다
'use client';

import { useState } from 'react';
import { EVENTS, type AccentLocale } from '@landit/analytics';

import { useAccentQuery } from '@/features/onboarding/model/useAccentQuery';
import { useSaveAccentMutation } from '@/features/onboarding/model/useSaveAccentMutation';
import { AccentForm } from '@/features/onboarding/ui/common/AccentForm';
import { track } from '@/shared/analytics';
import { BottomSheet } from '@/shared/ui/BottomSheet';

import { MenuButton, MenuGroup } from './Menu';

export const AccentMenuEntry = () => {
  const [open, setOpen] = useState(false);
  const { data } = useAccentQuery();
  const saveAccent = useSaveAccentMutation();

  const confirm = (locale: AccentLocale) => {
    saveAccent.mutate(locale);
    track(EVENTS.ACCENT_CHANGED, { accent: locale });
    setOpen(false);
  };

  return (
    <>
      <MenuGroup>
        <MenuButton title="배울 영어 변경하기" onClick={() => setOpen(true)} />
      </MenuGroup>

      <BottomSheet open={open} onClose={() => setOpen(false)}>
        <div className="flex max-h-[75dvh] flex-col">
          <h2 className="text-[17px] font-bold" style={{ color: '#111' }}>
            어떤 영어로 배우고 싶으세요?
          </h2>
          <p
            className="mt-1 mb-5 text-[14px] leading-6"
            style={{ color: '#666' }}
          >
            추천 표현과 피드백이 달라져요
          </p>
          {/* 지금 값을 모르면 아무것도 안 골라진 채로 연다 — 기본값(미국 영어)으로 열면
              다른 나라를 고른 사람이 그대로 확인을 눌러 원래 값을 덮어쓴다.
              시트를 다시 열면 그때의 저장값이 미리 골라진 채 열린다 — 닫힘 동안 언마운트라 key 없이도 초기화된다 */}
          {open && (
            <AccentForm
              initial={data?.accentLocale ?? null}
              onConfirm={confirm}
            />
          )}
        </div>
      </BottomSheet>
    </>
  );
};
