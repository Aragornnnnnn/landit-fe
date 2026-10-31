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

  it('스크롤 영역은 하단 safe-area를 읽거나, 아래에 늘 있는 푸터가 맡는다', () => {
    // 파일 어딘가에 변수가 있는지가 아니라 스크롤 영역마다 본다 — 푸터가 조건부면 그 스크롤이 바닥에 닿는다
    const offenders = collectSourceFiles(SRC_DIR)
      .filter((path) => path.endsWith('.tsx') && !/\.test\.tsx$/.test(path))
      .flatMap((path) => {
        const file = relative(SRC_DIR, path);
        if (SCROLL_EXCEPTIONS.has(file)) return [];
        return readFileSync(path, 'utf8')
          .split('\n')
          .map((line, i) => ({ line, at: `${file}:${i + 1}` }))
          .filter(
            ({ line }) =>
              /overflow-y-(auto|scroll)/.test(line) &&
              !line.includes('--safe-area-inset-bottom'),
          )
          .map(({ at }) => at);
      });

    expect(offenders).toEqual([]);
  });

  it('스크롤 예외 목록의 파일은 지금도 스크롤 영역을 가진다', () => {
    // 옮기거나 지운 파일이 목록에 남으면 예외 이유가 실제와 어긋난 채 남는다
    const stale = [...SCROLL_EXCEPTIONS].filter((path) => {
      const full = join(SRC_DIR, path);
      return (
        !existsSync(full) ||
        !/overflow-y-(auto|scroll)/.test(readFileSync(full, 'utf8'))
      );
    });

    expect(stale).toEqual([]);
  });
});

// 스크롤 영역이 바닥에 닿지 않는 파일 — 아래에 safe-area를 읽는 푸터가 늘 붙어 있거나, 화면 가운데·카드 안에 있다
const SCROLL_EXCEPTIONS = new Set([
  // 아래에 늘 있는 푸터가 safe-area를 맡는다
  'app/(protected)/smalltalk/sessions/[sessionId]/summary/_ui/SmallTalkSummary.tsx',
  'app/(protected)/me/subscription/cancel/_ui/ReasonStep.tsx',
  'app/(protected)/me/invite/_ui/InviteScreen.tsx',
  'app/(protected)/me/subscription/cancel/_ui/MethodStep.tsx',
  'app/(protected)/me/subscription/cancel/_ui/RetentionStep.tsx',
  'app/(protected)/premium/onboarding/_ui/RewardGuideStep.tsx',
  'app/(protected)/conversation/scenario/[scenarioId]/feedback/_ui/LevelResultScreen.tsx',
  'features/mailbox/ui/FeedbackComposeFlow.tsx',
  'features/feedback/ui/flow/FeedbackSummary.tsx',
  'features/feedback/ui/flow/FeedbackDetail.tsx',
  'features/review/ui/ReviewComplete.tsx',
  'features/expression/ui/QuizStepSkeleton.tsx',
  'features/expression/ui/common/StepScaffold.tsx',
  'features/expression/ui/ExpressionStages.tsx',
  'features/survey/ui/steps/MultiChoiceStep.tsx',
  'features/survey/ui/steps/SingleChoiceStep.tsx',
  'features/survey/ui/steps/TextStep.tsx',
  'features/onboarding/ui/common/AccentForm.tsx',
  'features/conversation/ui/flow/QuestionCard.tsx',
  'app/(protected)/(tabs)/roleplay/_ui/RoleplayHome.tsx',
  'app/(protected)/roleplay/new/_ui/CreateRoleplayFlow.tsx',
  // 바깥 스크롤 상자 — 안쪽 내용이 safe-area 여백을 맡는다
  'app/(protected)/me/page.tsx',
  'app/(public)/(legal)/_ui/LegalDocumentPage.tsx',
  'features/streak/ui/StreakFlow.tsx',
  'features/mailbox/ui/MailboxFlow.tsx',
  // 로그인은 화면 전체가 스크롤이고 안쪽 버튼 영역이 safe-area를 맡는다
  'app/(public)/(auth)/_ui/LoginScreen.tsx',
  // 카드 뒷면 안쪽 스크롤 — 바닥에 닿지 않는다
  'features/scenario/ui/card/ScenarioCardBack.tsx',
  // 높이가 고정된 내 답변 칸 안쪽 스크롤 — 바닥에 닿지 않는다
  'features/conversation/ui/flow/UserTranscript.tsx',
  // 개발자 전용
  'app/(protected)/me/developer/_ui/AlarmCheckScreen.tsx',
  'app/(protected)/me/developer/reward/_ui/RewardCheckScreen.tsx',
  'app/(protected)/me/developer/premium-onboarding/_ui/PremiumOnboardingCheckScreen.tsx',
]);
