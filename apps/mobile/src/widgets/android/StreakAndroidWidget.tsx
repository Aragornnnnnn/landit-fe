'use no memo';

// RemoteViews 변환기가 원시 함수 컴포넌트를 요구한다 — React Compiler 제외
// 안드로이드 스트릭 위젯 화면 — 상태 아트를 풀블리드로 그리고 숫자·주간 스트립을 오버레이한다 (RemoteViews 트리)
import {
  FlexWidget,
  ImageWidget,
  OverlapWidget,
  TextWidget,
} from 'react-native-android-widget';

import { buildWeekStrip } from '../week-strip';
import { WIDGET_ART } from '../widget-art';
import { artKeyOf, type WidgetFamily } from '../widget-art-key';
import type { WidgetState } from '../widget-state';
import {
  MILESTONE_INKS,
  TITLE_ALPHA_HEX,
  TITLE_FONT_SIZE,
  TITLE_KINDS,
  WEEK_STRIP_COLORS,
  WIDGET_LAYOUTS,
  WIDGET_THEMES,
} from '../widget-theme';
import { ART_RATIO, CARD_RADIUS, fitCard } from './card-box';

interface StreakAndroidWidgetProps {
  state: WidgetState;
  week: ReturnType<typeof buildWeekStrip>;
  family: WidgetFamily;
  // 위젯 실제 크기(dp) — 아트를 꽉 채우는 데 쓴다
  width: number;
  height: number;
  todayCardTitle?: string;
}

export const StreakAndroidWidget = ({
  state,
  week,
  family,
  width,
  height,
  todayCardTitle,
}: StreakAndroidWidgetProps) => {
  const theme = WIDGET_THEMES[state.kind];
  const layout = WIDGET_LAYOUTS[family];
  const ink =
    state.kind === 'milestone' && state.milestone !== null
      ? (MILESTONE_INKS[state.milestone] ?? theme.inkML)
      : family === 'small'
        ? theme.ink
        : theme.inkML;
  // 런처가 준 칸은 정사각이 아니다 — 아트 비율대로 카드를 잡고 남는 자리는 비운다
  const card = fitCard({ width, height, ratio: ART_RATIO[family] });
  // 디자인 카드(158×158 / 338×158 / 338×354dp) 좌표를 카드 실측 크기에 비율 환산한다
  const designWidth = family === 'small' ? 158 : 338;
  const designHeight = family === 'large' ? 354 : 158;
  const sx = card.width / designWidth;
  const sy = card.height / designHeight;
  const px = (value: number) => Math.round(value * sx);
  const py = (value: number) => Math.round(value * sy);
  const art = WIDGET_ART[artKeyOf(state, family)] as number | undefined;
  const fruit = WIDGET_ART.fruit as number | undefined;
  // 마일스톤 M·L 아트는 달성 문구가 그림에 포함돼 있어 오버레이하지 않는다.
  // Small은 다른 상태와 같은 자리에 열매+숫자를 그린다 — 크기별로 형태가 달라 보이지 않게
  const showNumber = state.kind !== 'milestone' || family === 'small';
  const showWeekStrip = family === 'large';
  // 오늘 카드 제목 — Medium 시간표 카드에만 제목 자리(24,112)가 있다
  const showTitle =
    family === 'medium' &&
    todayCardTitle != null &&
    TITLE_KINDS.includes(state.kind);

  return (
    // 카드 밖은 비워 둔다 — 칸을 꽉 채우면 아트가 잘리고 옆 위젯들보다 길쭉해 보인다
    <FlexWidget
      clickAction="OPEN_APP"
      style={{
        width,
        height,
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <OverlapWidget
        style={{
          width: card.width,
          height: card.height,
          borderRadius: px(CARD_RADIUS),
          backgroundColor: theme.bg as `#${string}`,
        }}
      >
        {art != null ? (
          <ImageWidget
            image={art}
            imageWidth={card.width}
            imageHeight={card.height}
            radius={px(CARD_RADIUS)}
            resizeMode="cover"
          />
        ) : null}
        {showNumber ? (
          <FlexWidget
            style={{
              width: 'match_parent',
              flexDirection: 'row',
              alignItems: 'center',
              // Large는 상단 중앙, S/M은 좌상단 — 디자인 카드의 Streak 자리
              justifyContent:
                layout.numberLeading === null ? 'center' : 'flex-start',
              marginTop: py(layout.numberTop),
              paddingLeft:
                layout.numberLeading === null ? 0 : px(layout.numberLeading),
            }}
          >
            {fruit != null ? (
              <ImageWidget
                image={fruit}
                imageWidth={py(layout.fruit)}
                imageHeight={py(layout.fruit)}
                style={{ marginRight: 6 }}
              />
            ) : null}
            <TextWidget
              text={String(state.displayStreak)}
              style={{
                fontSize: py(layout.number),
                fontWeight: '900',
                color: ink as `#${string}`,
              }}
            />
          </FlexWidget>
        ) : null}
        {showTitle ? (
          <TextWidget
            text={todayCardTitle}
            maxLines={1}
            truncate="END"
            style={{
              marginTop: py(112),
              marginLeft: px(24),
              width: Math.round(card.width * 0.45),
              fontSize: py(TITLE_FONT_SIZE),
              fontWeight: '500',
              color: `${theme.inkML}${TITLE_ALPHA_HEX}` as `#${string}`,
            }}
          />
        ) : null}
        {showWeekStrip ? (
          <FlexWidget
            style={{
              width: 'match_parent',
              height: 'match_parent',
              flexDirection: 'column',
              justifyContent: 'flex-end',
              alignItems: 'center',
            }}
          >
            <FlexWidget
              style={{
                flexDirection: 'row',
                backgroundColor: WEEK_STRIP_COLORS.background as `#${string}`,
                // 스트립 수치도 카드 배율을 탄다 — 고정값으로 두면 작은 카드에서 폭을 넘는다
                borderRadius: px(24),
                paddingHorizontal: px(8),
                paddingVertical: py(8),
                marginBottom: py(14),
              }}
            >
              {week.labels.map((label, index) => (
                <FlexWidget
                  key={label}
                  style={{
                    width: px(38),
                    flexDirection: 'column',
                    alignItems: 'center',
                  }}
                >
                  {week.done[index] && fruit != null ? (
                    <ImageWidget
                      image={fruit}
                      imageWidth={px(16)}
                      imageHeight={px(16)}
                    />
                  ) : (
                    // 완료 못 한 날은 시안대로 반투명 빈 원
                    <FlexWidget
                      style={{
                        width: px(16),
                        height: px(16),
                        borderRadius: px(8),
                        backgroundColor:
                          WEEK_STRIP_COLORS.emptyDot as `#${string}`,
                      }}
                    />
                  )}
                  <TextWidget
                    text={label}
                    style={{
                      fontSize: py(12),
                      fontWeight: '600',
                      color: WEEK_STRIP_COLORS.label as `#${string}`,
                      marginTop: py(5),
                    }}
                  />
                </FlexWidget>
              ))}
            </FlexWidget>
          </FlexWidget>
        ) : null}
      </OverlapWidget>
    </FlexWidget>
  );
};
