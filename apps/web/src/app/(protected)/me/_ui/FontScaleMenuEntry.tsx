'use client';

// 마이페이지 "글자 크기" 행 — 눌러 들어간 시트의 바를 옮겨 앱 전체 글자 크기를 다섯 단계 중에 고른다. 값은 이 기기의 localStorage에만 산다
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

// 손잡이 지름(px) — 그림·실제 터치 손잡이·바 안쪽 여백이 모두 이 값에서 나온다. 눈금이 손잡이 중심과 맞으려면 셋이 같아야 한다
const THUMB_SIZE_PX = 22;
const LAST_STEP = FONT_SCALES.length - 1;

// 누른 x좌표에서 가장 가까운 눈금 — 눈금은 바 양끝에서 손잡이 반지름만큼 안쪽에 있다
const stepAt = (clientX: number, { left, width }: DOMRect) => {
  const radius = THUMB_SIZE_PX / 2;
  const ratio = (clientX - left - radius) / (width - THUMB_SIZE_PX);
  return Math.min(LAST_STEP, Math.max(0, Math.round(ratio * LAST_STEP)));
};

export const FontScaleMenuEntry = () => {
  const [open, setOpen] = useState(false);
  // 서버 렌더와 첫 렌더는 숨긴 채로 둔다 — 구 셸에서 행이 떴다 사라지지 않게
  const available = useClientOnlyValue(
    () => isFontScaleAvailable(getNativeContextSnapshot(), navigator.userAgent),
    false,
  );
  const scale = useSyncExternalStore(
    subscribeFontScale,
    getFontScale,
    () => DEFAULT_FONT_SCALE,
  );

  if (!available) return null;

  const step = FONT_SCALES.indexOf(scale);
  const percent = (step / LAST_STEP) * 100;

  const choose = (next: FontScale) => {
    // 끄는 동안 같은 칸에서도 change가 들어온다 — 바뀐 게 없으면 저장도 계측도 하지 않는다
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
        // 설명은 두지 않는다 — 고르는 순간 시트 뒤 화면 글자가 바뀌어 그걸로 알 수 있다
        title="글자 크기"
      >
        {/* 휴대폰 설정처럼 「작은 가 — 바 — 큰 가」. 옮기는 순간 시트 뒤 화면 글자가 바뀌어 따로 미리보기를 두지 않는다.
            바·「가」·이름은 배율을 받지 않는 고정 크기다 — 옮길 때마다 바가 커지면 손가락 아래 자리가 흔들린다 */}
        <div className="mt-5 flex items-center gap-3.5 [--font-scale:1]">
          <span className="text-13 font-medium text-[#6B7280]" aria-hidden>
            가
          </span>
          <div
            className="relative h-7 flex-1"
            style={{ '--thumb': `${THUMB_SIZE_PX}px` } as React.CSSProperties}
          >
            <div
              className="absolute inset-y-0"
              style={{ left: THUMB_SIZE_PX / 2, right: THUMB_SIZE_PX / 2 }}
              aria-hidden
            >
              <span className="absolute inset-x-0 top-1/2 h-1 -translate-y-1/2 rounded-full bg-[#E5E5EA]" />
              <span
                className="absolute top-1/2 left-0 h-1 -translate-y-1/2 rounded-full bg-primary transition-[width] duration-150"
                style={{ width: `${percent}%` }}
              />
              {FONT_SCALES.map((option, index) => (
                <span
                  key={option}
                  className={`absolute top-1/2 size-2 -translate-1/2 rounded-full ${
                    index <= step ? 'bg-primary' : 'bg-[#D1D1D6]'
                  }`}
                  style={{
                    left: `${(index / LAST_STEP) * 100}%`,
                  }}
                />
              ))}
              <span
                className="absolute top-1/2 size-(--thumb) -translate-1/2 rounded-full border-[0.5px] border-[#E5E5EA] bg-white shadow-[0_2px_6px_rgba(0,0,0,0.18)] transition-[left] duration-150"
                style={{ left: `${percent}%` }}
              />
            </div>
            {/* 끌기·키보드는 기본 range 입력이 맡는다 — 보이지 않게 위에 깔고 손잡이 폭을 그림과 맞춘다 */}
            <input
              type="range"
              min={0}
              max={LAST_STEP}
              step={1}
              value={step}
              onChange={(event) =>
                choose(FONT_SCALES[Number(event.target.value)])
              }
              // iOS는 바를 눌러도 값이 바뀌지 않아 손잡이를 끌어야만 움직인다 — 누른 자리로 직접 옮긴다(Android는 같은 값이라 choose가 건너뛴다)
              onClick={(event) =>
                choose(
                  FONT_SCALES[
                    stepAt(
                      event.clientX,
                      event.currentTarget.getBoundingClientRect(),
                    )
                  ],
                )
              }
              aria-label="글자 크기"
              aria-valuetext={LABELS[scale]}
              className="absolute inset-0 m-0 w-full cursor-pointer appearance-none bg-transparent opacity-0 [&::-moz-range-thumb]:size-(--thumb) [&::-webkit-slider-thumb]:size-(--thumb) [&::-webkit-slider-thumb]:appearance-none"
            />
          </div>
          <span className="text-22 font-medium text-[#6B7280]" aria-hidden>
            가
          </span>
        </div>

        <p className="mt-2 text-center text-12 font-bold text-[#111] [--font-scale:1]">
          {LABELS[scale]}
        </p>
      </SettingSheet>
    </>
  );
};
