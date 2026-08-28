// 위젯 팔레트·레이아웃 수치 — 피그마 카드에서 추출한 값의 단일 출처
// 주의: iOS 위젯 컴포넌트(StreakWidget)는 직렬화 제약으로 같은 값을 함수 안에 인라인로 갖는다 — 값 변경 시 함께 고칠 것
import type { WidgetStateKind } from '../model/widget-state';
import type { WidgetFamily } from './widget-art-key';

// ink는 Small(단색 배경), inkML은 M/L(그라데이션 배경) 카드의 실제 숫자 색
export const WIDGET_THEMES: Record<
  WidgetStateKind,
  { bg: string; ink: string; inkML: string }
> = {
  // 시작 전 — 아트 없이 배경색과 안내 문구만 그린다
  welcome: { bg: '#EFE6F7', ink: '#5D4694', inkML: '#5D4694' },
  arrived: { bg: '#92D8F7', ink: '#0E3A5C', inkML: '#FFF3E0' },
  carpet: { bg: '#FFF3D8', ink: '#8A5A0E', inkML: '#8A5A0E' },
  nudge: { bg: '#FFF9D6', ink: '#9C6200', inkML: '#9C6200' },
  ask: { bg: '#FFE4C7', ink: '#8A4B00', inkML: '#FFE4EC' },
  wait: { bg: '#D9CFF5', ink: '#4A2F8F', inkML: '#D8C4FF' },
  risk: { bg: '#E14E30', ink: '#FFF3EC', inkML: '#FFE3D6' },
  melted: { bg: '#383278', ink: '#EFEDFF', inkML: '#D9D6FF' },
  last: { bg: '#211C58', ink: '#FFE28A', inkML: '#FFD9D0' },
  plead: { bg: '#3E5C80', ink: '#F4F9FF', inkML: '#EAF2FF' },
  done: { bg: '#7BC86C', ink: '#123D0C', inkML: '#8A6A00' },
  scored: { bg: '#57B94C', ink: '#F2FFEF', inkML: '#F0FFE0' },
  love: { bg: '#FFC6D9', ink: '#8F1E45', inkML: '#8E2C55' },
  hungry: { bg: '#FFEFD2', ink: '#8A4B00', inkML: '#D9CCFF' },
  burnt: { bg: '#7A2800', ink: '#FFD9A8', inkML: '#FFE3C2' },
  bone: { bg: '#9FE2FA', ink: '#1A7BC8', inkML: '#0E3A5C' },
  cracked: { bg: '#5B5F73', ink: '#F1F2F7', inkML: '#F2E2B8' },
  gone: { bg: '#0A0908', ink: '#D8D5CF', inkML: '#B8AD9E' },
  milestone: { bg: '#57B94C', ink: '#F2FFEF', inkML: '#F0FFE0' },
};

// 사이즈별 숫자·열매 크기와 숫자 위치(디자인 카드의 Streak 자리)
export const WIDGET_LAYOUTS: Record<
  WidgetFamily,
  {
    number: number;
    fruit: number;
    numberTop: number;
    numberLeading: number | null;
  }
> = {
  small: { number: 26, fruit: 22, numberTop: 10, numberLeading: 10 },
  medium: { number: 34, fruit: 26, numberTop: 22, numberLeading: 24 },
  large: { number: 46, fruit: 34, numberTop: 26, numberLeading: null },
};

// 마일스톤은 달성 단계마다 배경이 달라 숫자 색도 다르다 — 시안의 달성 문구 색을 그대로 쓴다
export const MILESTONE_INKS: Record<number, string> = {
  7: '#FFFFFF',
  14: '#7A4A10',
  20: '#4A3D78',
  30: '#E4FFF6',
};

// 주간 스트립 색 — 시안 WeekStrip에서 추출
export const WEEK_STRIP_COLORS = {
  background: '#140F3AB8',
  emptyDot: '#D8D2FF38',
  label: '#E3DFF7',
} as const;

// 오늘 카드 제목을 보여주는 상태 — Medium 시간표 카드에만 제목 자리가 있다 (디자인 좌표 24,112)
export const TITLE_KINDS: WidgetStateKind[] = [
  'arrived',
  'carpet',
  'nudge',
  'ask',
  'wait',
  'risk',
  'melted',
];

// 제목 스타일 — 색은 해당 상태 inkML의 72%(hex B8), 크기 13 (디자인 값)
// 오늘 카드 제목을 모를 때 대신 쓰는 문구 — 자정을 넘겨 제목이 지워졌거나 오늘 카드가 없을 때다.
// 빈 자리로 두면 카드가 허전해서, 어느 날에나 맞는 말을 대신 세운다
export const TITLE_FALLBACK = '래디가 기다리고 있어요';

export const TITLE_ALPHA_HEX = 'B8';
export const TITLE_FONT_SIZE = 13;
