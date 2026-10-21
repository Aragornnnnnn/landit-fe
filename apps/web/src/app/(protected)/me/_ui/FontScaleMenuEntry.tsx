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

// 칸 안 "가"는 배율을 받지 않는 고정 크기로 단계마다 키운다 — 고를 때마다 칸이 커지면 누를 자리가 흔들린다
const GLYPH_PX: Record<FontScale, number> = {
  0.85: 13,
  0.92: 15,
  1: 17,
  1.15: 19,
  1.3: 21,
};

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
        {/* 음성 속도 시트와 같은 세그먼트 — 고르면 시트 뒤 화면 글자가 바로 바뀌어 따로 미리보기를 두지 않는다 */}
        <div
          role="radiogroup"
          aria-label="글자 크기"
          className="mt-5 flex gap-0 rounded-[10px] p-1"
          style={{ background: '#F2F2F7' }}
        >
          {FONT_SCALES.map((option) => {
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
                  fontSize: GLYPH_PX[option],
                }}
              >
                가
              </button>
            );
          })}
        </div>

        {/* 칸마다 이름을 바로 아래에 단다 — 배율을 받지 않아 가장 크게에서도 한 줄이다 */}
        <div className="mt-2 flex px-1" aria-hidden>
          {FONT_SCALES.map((option) => (
            <span
              key={option}
              className={`flex-1 text-center text-[11px] whitespace-nowrap ${
                option === scale ? 'font-bold' : ''
              }`}
              style={{ color: option === scale ? '#111' : '#9CA3AF' }}
            >
              {LABELS[option]}
            </span>
          ))}
        </div>
      </SettingSheet>
    </>
  );
};
