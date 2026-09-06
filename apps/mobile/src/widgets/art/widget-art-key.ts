// 위젯 아트 키 — 상태·사이즈로 assets/widgets 파일 키를 만든다
// 주의: iOS 위젯 컴포넌트(StreakWidget)는 직렬화 제약으로 같은 규칙을 함수 안에 인라인로 갖는다 — 규칙 변경 시 함께 고칠 것
import type { WidgetState } from '../model/widget-state';

export type WidgetFamily = 'small' | 'medium' | 'large';

export const artKeyOf = (state: WidgetState, family: WidgetFamily): string => {
  const kind =
    state.kind === 'milestone' && state.milestone !== null
      ? `milestone-${state.milestone}`
      : state.kind;
  return `${kind}-${family}`;
};
