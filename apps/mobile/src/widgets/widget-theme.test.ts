// 팔레트 동기화 검증 — iOS 위젯은 직렬화 제약(함수 밖 참조 불가)으로 같은 값을 인라인로 갖는다.
// 한쪽만 고치면 두 플랫폼 화면이 조용히 달라지므로, 소스에 값이 실제로 박혀 있는지 확인한다.
import fs from 'node:fs';
import path from 'node:path';

import {
  TITLE_FONT_SIZE,
  TITLE_KINDS,
  WEEK_STRIP_COLORS,
  WIDGET_LAYOUTS,
  WIDGET_THEMES,
} from './widget-theme';

const iosWidgetSource = fs.readFileSync(
  path.join(__dirname, 'StreakWidget.tsx'),
  'utf8',
);

describe('widget-theme ↔ iOS 위젯 인라인 값', () => {
  it.each(Object.entries(WIDGET_THEMES))(
    '%s 상태의 배경·잉크 색이 iOS 위젯에도 그대로 있다',
    (kind, theme) => {
      expect(iosWidgetSource).toContain(kind);
      expect(iosWidgetSource).toContain(theme.bg);
      expect(iosWidgetSource).toContain(theme.ink);
      expect(iosWidgetSource).toContain(theme.inkML);
    },
  );

  it.each(Object.entries(WIDGET_LAYOUTS))(
    '%s 사이즈의 숫자·열매 크기가 iOS 위젯에도 그대로 있다',
    (family, layout) => {
      expect(iosWidgetSource).toContain(
        `${family}: { number: ${layout.number}`,
      );
      expect(iosWidgetSource).toContain(`fruit: ${layout.fruit}`);
    },
  );

  it('주간 스트립 색과 제목 규칙이 iOS 위젯에도 그대로 있다', () => {
    for (const color of Object.values(WEEK_STRIP_COLORS)) {
      expect(iosWidgetSource).toContain(color);
    }
    expect(iosWidgetSource).toContain(`size: ${TITLE_FONT_SIZE}`);
    for (const kind of TITLE_KINDS) {
      expect(iosWidgetSource).toContain(`'${kind}'`);
    }
  });
});
