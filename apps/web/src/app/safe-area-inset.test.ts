// safe-area는 globals.css의 변수로만 읽는지 — env()를 직접 쓰면 Android 셸이 주입한 inset을 못 받아 구형 WebView에서 내비게이션 바에 가려진다
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join, relative } from 'node:path';
import { NATIVE_INSET_VARS } from '@landit/bridge';
import { describe, expect, it } from 'vitest';

const SRC_DIR = join(import.meta.dirname, '..');
const GLOBALS_CSS = join(import.meta.dirname, 'globals.css');
// 전역 에러 화면은 <html>을 새로 그려 셸 주입값이 지워지고 globals.css도 없을 수 있다 — env()를 직접 쓰는 유일한 예외
const GLOBAL_ERROR = join(import.meta.dirname, 'global-error.tsx');

const collectSourceFiles = (dir: string): string[] =>
  readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) return collectSourceFiles(path);
    return /\.(tsx?|css)$/.test(entry.name) ? [path] : [];
  });

describe('safe-area inset 변수', () => {
  it('globals.css가 셸이 넘긴 값을 먼저 읽고 없으면 env()로 폴백한다', () => {
    // Prettier가 긴 var()를 여러 줄로 쪼개므로 공백을 지우고 비교한다
    const css = readFileSync(GLOBALS_CSS, 'utf8').replace(/\s+/g, '');

    expect(css).toContain(
      `var(${NATIVE_INSET_VARS.top},env(safe-area-inset-top`,
    );
    expect(css).toContain(
      `var(${NATIVE_INSET_VARS.bottom},env(safe-area-inset-bottom`,
    );
  });

  it('globals.css 밖에서는 env(safe-area-inset-*)를 직접 쓰지 않는다', () => {
    const files = collectSourceFiles(SRC_DIR);
    // 수집 조건이 어긋나 파일이 안 모이면 이 검사가 조용히 통과한다
    expect(files.length).toBeGreaterThan(100);

    const offenders = files
      // 이 테스트 파일은 검증 문자열에 env()가 들어 있어 스스로를 뺀다
      .filter(
        (path) =>
          path !== GLOBALS_CSS &&
          path !== GLOBAL_ERROR &&
          path !== import.meta.filename,
      )
      .filter((path) =>
        /env\(safe-area-inset-(top|bottom|left|right)\b/.test(
          readFileSync(path, 'utf8'),
        ),
      )
      .map((path) => relative(SRC_DIR, path));

    expect(offenders).toEqual([]);
  });

  it('전체 화면은 하단 safe-area를 읽는다', () => {
    const offenders = collectSourceFiles(SRC_DIR)
      .filter((path) => !/\.test\.tsx?$/.test(path))
      .filter((path) => {
        const source = readFileSync(path, 'utf8');
        return (
          /\bh-dvh\b/.test(source) &&
          !source.includes('--safe-area-inset-bottom')
        );
      })
      .map((path) => relative(SRC_DIR, path))
      .filter((path) => !FULL_SCREEN_EXCEPTIONS.has(path));

    expect(offenders).toEqual([]);
  });

  it('예외 목록의 화면은 지금도 있는 전체 화면이다', () => {
    // 옮기거나 지운 화면이 목록에 남으면 예외 이유가 실제와 어긋난 채 남는다
    const stale = [...FULL_SCREEN_EXCEPTIONS].filter((path) => {
      const full = join(SRC_DIR, path);
      return !existsSync(full) || !/\bh-dvh\b/.test(readFileSync(full, 'utf8'));
    });

    expect(stale).toEqual([]);
  });
});

// 하단 safe-area를 직접 안 읽어도 되는 전체 화면 — 내용이 가운데 있거나, 바닥은 자식 화면이 맡는다
const FULL_SCREEN_EXCEPTIONS = new Set([
  // 가운데 정렬 — 바닥에 닿는 내용이 없다
  'app/(protected)/layout.tsx',
  'app/(protected)/conversation/smalltalk/_ui/SmallTalkFlow.tsx',
  'app/(protected)/conversation/scenario/[scenarioId]/page.tsx',
  'app/(protected)/conversation/scenario/[scenarioId]/feedback/_ui/AnalyzingScreen.tsx',
  'features/feedback/ui/flow/FeedbackNotice.tsx',
  'features/review/ui/ReviewNotice.tsx',
  'features/review/ui/ReviewFlow.tsx',
  'features/expression/ui/ExpressionFlow.tsx',
  // 위에서부터 짧게 쌓여 바닥까지 안 내려온다
  'app/(protected)/me/alarm/_ui/AlarmScreen.tsx',
  // 껍데기 — 바닥은 자식이 맡는다
  'app/(protected)/(tabs)/layout.tsx',
  'app/(protected)/mailbox/page.tsx',
  'app/(protected)/me/widget/_ui/WidgetGuideScreen.tsx',
  'app/(protected)/me/subscription/cancel/_ui/CancelFlowScreen.tsx',
  'app/(protected)/scenario/[scenarioId]/sessions/[sessionId]/_ui/ScenarioSessionFeedback.tsx',
  // 개발자 전용
  'app/(protected)/me/developer/_ui/AlarmCheckScreen.tsx',
  'app/(protected)/me/developer/reward/_ui/RewardCheckPreview.tsx',
  'app/(protected)/me/developer/reward/_ui/RewardCheckScreen.tsx',
  'app/(protected)/me/developer/premium-onboarding/_ui/PremiumOnboardingCheckScreen.tsx',
]);
