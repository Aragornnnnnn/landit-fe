'use client';

// 마이페이지 "글자 크기" 행 — 눌러 들어간 시트에서 앱 전체 글자 크기를 다섯 단계 중에 고른다. 값은 이 기기의 localStorage에만 산다
import { useState, useSyncExternalStore } from 'react';
import { EVENTS } from '@landit/analytics';

import { track } from '@/shared/analytics';
import { getNativeContextSnapshot } from '@/shared/bridge/native-context';
import {
  DEFAULT_FONT_SCALE,
  FONT_SCALES,
  getFontScale,
  isFontScaleAvailable,
  setFontScale,
  subscribeFontScale,
  type FontScale,
} from '@/shared/font-scale/font-scale';
import { useClientOnlyValue } from '@/shared/lib/useClientOnlyValue';
import { Emoji } from '@/shared/ui/emoji';

import { MenuButton } from './Menu';
import { SettingSheet } from './SettingSheet';

const LABELS: Record<FontScale, string> = {
  0.85: '가장 작게',
  0.92: '작게',
  1: '보통',
  1.15: '크게',
  1.3: '가장 크게',
};

// 칸 안의 "가"는 배율을 받지 않는 고정 크기다 — 고를 때마다 칸이 커지면 누를 자리가 흔들린다
const GLYPH_PX = [13, 15, 17, 19, 21];

export const FontScaleMenuEntry = () => {
  const [open, setOpen] = useState(false);
  // 서버 렌더와 첫 렌더는 숨긴 채로 둔다 — 구 셸에서 행이 떴다 사라지지 않게
  const available = useClientOnlyValue(
    () => isFontScaleAvailable(getNativeContextSnapshot()),
    false,
  );
  const scale = useSyncExternalStore(
    subscribeFontScale,
    getFontScale,
    () => DEFAULT_FONT_SCALE,
  );

  if (!available) return null;

  const choose = (next: FontScale) => {
    // 이미 고른 칸을 다시 눌러도 role="radio" 버튼은 클릭이 들어온다 — 바뀐 게 없으면 계측하지 않는다
    if (next === getFontScale()) return;
    setFontScale(next);
    track(EVENTS.FONT_SCALE_CHANGED, { scale: next });
  };

  return (
    <>
      <MenuButton
        title="글자 크기"
        icon={<Emoji>🔠</Emoji>}
        onClick={() => setOpen(true)}
      />

      <SettingSheet
        open={open}
        onClose={() => setOpen(false)}
        title="글자 크기"
        description="앱 전체 글자 크기예요"
      >
        <div
          role="radiogroup"
          aria-label="글자 크기"
          className="flex gap-0 rounded-[10px] p-1"
          style={{ background: '#F2F2F7' }}
        >
          {FONT_SCALES.map((option, index) => {
            const selected = option === scale;
            return (
              <button
                key={option}
                type="button"
                role="radio"
                aria-checked={selected}
                aria-label={LABELS[option]}
                onClick={() => choose(option)}
                className={`flex h-10 flex-1 items-center justify-center rounded-lg transition-colors ${
                  selected ? 'bg-white font-bold shadow-sm' : 'font-medium'
                }`}
                style={{
                  color: selected ? '#111' : '#6B7280',
                  fontSize: GLYPH_PX[index],
                }}
              >
                가
              </button>
            );
          })}
        </div>

        <p className="mt-2 text-center text-12" style={{ color: '#9CA3AF' }}>
          {LABELS[scale]}
        </p>

        {/* 고른 크기가 실제로 어떤지 바로 보이는 자리 — 이 글자는 배율을 받는다 */}
        <p
          className="mt-4 rounded-xl px-4 py-3 text-15 leading-relaxed"
          style={{ background: '#F7F7F8', color: '#111' }}
        >
          방금 그 영어, 진짜 통했을까?
          <br />
          외국인 속마음을 들려드려요
        </p>
      </SettingSheet>
    </>
  );
};
