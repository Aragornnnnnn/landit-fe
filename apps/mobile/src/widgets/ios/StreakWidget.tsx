// 스트릭 홈 위젯 — 피그마 Final 보드에서 export한 상태별 아트를 풀블리드로 그리고 스트릭 숫자만 오버레이한다
import { Circle, HStack, Image, Text, VStack, ZStack } from '@expo/ui/swift-ui';
import {
  background,
  containerBackground,
  cornerRadius,
  font,
  foregroundStyle,
  frame,
  lineLimit,
  padding,
  resizable,
  truncationMode,
  widgetURL,
} from '@expo/ui/swift-ui/modifiers';
import { createWidget, type WidgetEnvironment } from 'expo-widgets';

import type { WidgetStateKind } from '../model/widget-state';

export interface StreakWidgetProps {
  // WidgetKit placeholder(설치 직후·로그인 전)는 props 없이 렌더한다 — 모두 없을 수 있다
  kind?: WidgetStateKind;
  displayStreak?: number;
  // 네이티브 props가 null을 못 실어서 값이 없으면 키를 생략한다
  milestone?: number;
  // 아트 webp가 복사된 공유 디렉터리 file URI (트레일링 슬래시 포함), 복사 실패 시 생략
  artDir?: string;
  // 오늘 카드 제목 — Medium 시간표 상태에서만 그린다
  todayCardTitle?: string;
  // 주간 스트립 — 오늘(서울)로 끝나는 7칸의 요일 라벨과 완료 여부 (Large 전용)
  weekLabels?: string[];
  weekDone?: boolean[];
}

const StreakWidgetView = (
  props: StreakWidgetProps,
  environment: WidgetEnvironment,
) => {
  'widget';
  // 함수 밖 값은 위젯 런타임에 존재하지 않는다(소스 문자열만 직렬화) — 상수도 함수 안에 둔다
  // 상태별 배경(아트 결손 대비)과 숫자 잉크 — ink는 Small(단색 배경), inkML은 M/L(그라데이션 배경) 카드의 실제 값
  const THEMES: Record<string, { bg: string; ink: string; inkML: string }> = {
    welcome: { bg: '#EFE6F7', ink: '#5D4694', inkML: '#5D4694' },
    arrived: { bg: '#92D8F7', ink: '#0E3A5C', inkML: '#FFF3E0' },
    // carpet은 밝은 모래빛 배경이라 사이즈 무관 진갈색 — 원본 카드의 숫자 색 그대로
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
  const family =
    environment.widgetFamily === 'systemLarge'
      ? 'large'
      : environment.widgetFamily === 'systemMedium'
        ? 'medium'
        : 'small';
  // 사이즈별 수치는 한 표로 — 숫자·열매 크기와 숫자 위치(디자인 카드의 Streak 자리)
  const LAYOUTS = {
    small: { number: 26, fruit: 22, numberPadding: { top: 10, leading: 10 } },
    medium: { number: 34, fruit: 26, numberPadding: { top: 22, leading: 24 } },
    large: { number: 46, fruit: 34, numberPadding: { top: 26 } },
  } as const;
  const layout = LAYOUTS[family];

  // 위젯 데이터가 아직 없는 상태(설치 직후) — 아트가 공유 디렉터리에 복사되기 전이라 그림을 못 쓴다.
  // 브랜드 배경에 시작 안내만 그린다. 로그인 전(welcome)은 아트가 있어서 아래 일반 경로로 그린다.
  // 주의: 이 함수 안에서는 역슬래시 이스케이프(줄바꿈 등)가 직렬화 때 실제 문자로 풀려 소스가 깨진다
  if (props.kind == null) {
    const guideFont = font({
      weight: 'bold',
      size: family === 'small' ? 14 : 16,
    });
    return (
      <ZStack
        modifiers={[
          containerBackground('#92D8F7', 'widget'),
          widgetURL('landit://widget'),
        ]}
      >
        <VStack spacing={2} modifiers={[padding({ horizontal: 12 })]}>
          <Text modifiers={[guideFont, foregroundStyle('#0E3A5C')]}>
            랜딧과 대화하고
          </Text>
          <Text modifiers={[guideFont, foregroundStyle('#0E3A5C')]}>
            스트릭을 시작해보세요!
          </Text>
        </VStack>
      </ZStack>
    );
  }

  const theme = THEMES[props.kind] ?? THEMES.arrived;
  // 마일스톤은 달성 단계마다 배경이 달라 숫자 색도 다르다 — 시안의 달성 문구 색
  const MILESTONE_INKS: Record<number, string> = {
    7: '#FFFFFF',
    14: '#7A4A10',
    20: '#4A3D78',
    30: '#E4FFF6',
  };
  const ink =
    props.kind === 'milestone' && props.milestone != null
      ? (MILESTONE_INKS[props.milestone] ?? theme.inkML)
      : family === 'small'
        ? theme.ink
        : theme.inkML;
  const artKey =
    (props.kind === 'milestone' && props.milestone != null
      ? `milestone-${props.milestone}`
      : props.kind) + `-${family}`;
  const artUri = props.artDir == null ? null : `${props.artDir}${artKey}.webp`;
  // 마일스톤 M·L 아트는 달성 문구가 그림에 포함돼 있어 오버레이하지 않는다.
  // Small은 다른 상태와 같은 자리에 열매+숫자를 그린다 — 크기별로 형태가 달라 보이지 않게
  const showNumber = props.kind !== 'milestone' || family === 'small';
  // 스트릭 열매 아이콘 — 웹 StreakFruit와 같은 정본 에셋
  const fruitUri = props.artDir == null ? null : `${props.artDir}fruit.webp`;

  // 시작 전 카드에는 주간 스트립 자리가 없다 — 쌓은 기록이 아직 없다
  const showWeekStrip =
    family === 'large' &&
    props.kind !== 'welcome' &&
    props.weekLabels != null &&
    props.weekDone != null &&
    props.weekLabels.length === 7;

  // 오늘 카드 제목 — Medium 시간표 카드에만 제목 자리(24,112)가 있다. 색은 inkML의 72%(hex B8)
  const TITLE_KINDS = [
    'arrived',
    'carpet',
    'nudge',
    'ask',
    'wait',
    'risk',
    'melted',
  ];
  // 제목을 몰라도 자리는 채운다 — 기준일이 지나 빠졌거나 오늘 카드가 없을 때다
  const TITLE_FALLBACK = '래디가 기다리고 있어요';
  const showTitle = family === 'medium' && TITLE_KINDS.includes(props.kind);

  return (
    <ZStack
      alignment="bottom"
      modifiers={[
        containerBackground(theme.bg, 'widget'),
        widgetURL('landit://widget'),
      ]}
    >
      <ZStack alignment={family === 'large' ? 'top' : 'topLeading'}>
        {artUri !== null ? (
          <Image uiImage={artUri} modifiers={[resizable()]} />
        ) : null}
        {showNumber ? (
          <HStack spacing={6} modifiers={[padding(layout.numberPadding)]}>
            {fruitUri !== null ? (
              <Image
                uiImage={fruitUri}
                modifiers={[
                  resizable(),
                  frame({ width: layout.fruit, height: layout.fruit }),
                ]}
              />
            ) : null}
            <Text
              modifiers={[
                // 디자인 폰트(Nunito Black) 임베드 전까지 SF Rounded black으로 숫자 인상을 맞춘다
                font({
                  weight: 'black',
                  size: layout.number,
                  design: 'rounded',
                }),
                foregroundStyle(ink),
              ]}
            >
              {String(props.displayStreak ?? 0)}
            </Text>
          </HStack>
        ) : null}
        {showTitle ? (
          <Text
            modifiers={[
              font({ size: 13, weight: 'medium' }),
              foregroundStyle(`${theme.inkML}B8`),
              lineLimit(1),
              truncationMode('tail'),
              frame({ maxWidth: 150, alignment: 'leading' }),
              padding({ top: 112, leading: 24 }),
            ]}
          >
            {props.todayCardTitle ?? TITLE_FALLBACK}
          </Text>
        ) : null}
      </ZStack>
      {showWeekStrip ? (
        <HStack
          spacing={0}
          modifiers={[
            padding({ horizontal: 8, vertical: 8 }),
            background('#140F3AB8'),
            cornerRadius(24),
            padding({ bottom: 14 }),
          ]}
        >
          {props.weekLabels!.map((label, index) => (
            <VStack key={label} spacing={5} modifiers={[frame({ width: 38 })]}>
              {props.weekDone![index] && fruitUri !== null ? (
                <Image
                  uiImage={fruitUri}
                  modifiers={[resizable(), frame({ width: 16, height: 16 })]}
                />
              ) : (
                // 완료 못 한 날은 시안대로 반투명 빈 원
                <Circle
                  modifiers={[
                    frame({ width: 16, height: 16 }),
                    foregroundStyle('#D8D2FF38'),
                  ]}
                />
              )}
              <Text
                modifiers={[
                  font({ size: 12, weight: 'semibold' }),
                  foregroundStyle('#E3DFF7'),
                ]}
              >
                {label}
              </Text>
            </VStack>
          ))}
        </HStack>
      ) : null}
    </ZStack>
  );
};

export default createWidget<StreakWidgetProps>(
  'StreakWidget',
  StreakWidgetView,
);
