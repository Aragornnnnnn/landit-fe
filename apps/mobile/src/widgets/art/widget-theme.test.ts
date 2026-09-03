// 팔레트 동기화 검증 — iOS 위젯은 직렬화 제약(함수 밖 참조 불가)으로 같은 값을 인라인로 갖는다.
// 한쪽만 고치면 두 플랫폼 화면이 조용히 달라지므로, 소스에 값이 실제로 박혀 있는지 확인한다.
import fs from 'node:fs';
import path from 'node:path';

import {
  MILESTONE_INKS,
  WEEK_STRIP_COLORS,
  WIDGET_LAYOUTS,
  WIDGET_THEMES,
} from './widget-theme';

const iosWidgetSource = fs.readFileSync(
  path.join(__dirname, '../ios/StreakWidget.tsx'),
  'utf8',
);

describe('widget-theme ↔ iOS 위젯 인라인 값', () => {
  // 값이 소스 어딘가에 있기만 하면 통과하지 않도록 상태·사이즈 블록 단위로 묶어서 본다
  it.each(Object.entries(WIDGET_THEMES))(
    '%s 상태를 바꾸면 iOS 위젯의 같은 상태 블록도 함께 바뀌어야 한다',
    (kind, theme) => {
      expect(iosWidgetSource).toMatch(
        new RegExp(
          `${kind}:\\s*\\{\\s*bg: '${theme.bg}',\\s*ink: '${theme.ink}',\\s*inkML: '${theme.inkML}'`,
        ),
      );
    },
  );

  it.each(Object.entries(WIDGET_LAYOUTS))(
    '%s 사이즈를 바꾸면 iOS 위젯의 같은 사이즈 블록도 함께 바뀌어야 한다',
    (family, layout) => {
      expect(iosWidgetSource).toMatch(
        new RegExp(
          `${family}:\\s*\\{\\s*number: ${layout.number},\\s*fruit: ${layout.fruit}\\b`,
        ),
      );
    },
  );

  it('마일스톤 숫자 색을 바꾸면 iOS 위젯의 같은 단계 색도 함께 바뀌어야 한다', () => {
    for (const [milestone, ink] of Object.entries(MILESTONE_INKS)) {
      expect(iosWidgetSource).toContain(`${milestone}: '${ink}'`);
    }
  });

  it('주간 스트립 색을 바꾸면 iOS 위젯도 함께 바뀌어야 한다', () => {
    for (const color of Object.values(WEEK_STRIP_COLORS)) {
      expect(iosWidgetSource).toContain(color);
    }
  });

  it('4×2 위젯에 카드 제목 오버레이를 다시 넣지 않는다', () => {
    // todayCardTitle을 Text로 렌더하면 그 제목 padding이 medium ZStack을 늘려 아트가 찌부됐었다.
    // prop 선언 한 곳에만 있어야 한다 — 렌더 자리에 다시 쓰이면 개수가 늘어 이 테스트가 잡는다
    const uses = iosWidgetSource.match(/todayCardTitle/g) ?? [];
    expect(uses).toHaveLength(1);
  });
});
