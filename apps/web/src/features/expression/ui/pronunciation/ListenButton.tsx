'use client';

// 발음 듣기 공용 버튼 — 대기: 회색 배경+전경 아이콘, 재생 중: 전경색 배경+흰 아이콘 (전 화면 동일 문법)
// 원어민이든 내 녹음이든 "듣는" 동작은 전부 스피커 — 누구 소리인지는 옆 라벨이 말한다
import { SpeakerIcon } from '@/shared/ui/Icons';

interface ListenButtonProps {
  playing: boolean;
  onClick: () => void;
  // 있으면 칩(아이콘+문구), 없으면 원형 아이콘 버튼
  label?: string;
  ariaLabel?: string;
}

const SHAPE = {
  chip: 'gap-1.5 border border-transparent px-3 py-1.5 text-xs font-semibold',
  circle: 'size-8 flex-none',
} as const;

// 칩은 말풍선(bg-secondary) 위에 놓이므로 대기 배경을 card로 해 윤곽을 살린다
const IDLE = {
  chip: 'border-border bg-card text-foreground',
  circle: 'bg-secondary text-foreground',
} as const;

export const ListenButton = ({
  playing,
  onClick,
  label,
  ariaLabel,
}: ListenButtonProps) => {
  const shape = label ? 'chip' : 'circle';
  return (
    <button
      onClick={onClick}
      aria-label={ariaLabel ?? label ?? '발음 듣기'}
      className={`flex items-center justify-center rounded-full transition-colors active:opacity-70 ${SHAPE[shape]} ${
        playing ? 'bg-foreground text-background' : IDLE[shape]
      }`}
    >
      <SpeakerIcon size={label ? 14 : 15} />
      {label}
    </button>
  );
};
