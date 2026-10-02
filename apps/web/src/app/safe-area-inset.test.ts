// safe-area는 globals.css의 변수로만 읽는지 — env()를 직접 쓰면 Android 셸이 주입한 inset을 못 받아 구형 WebView에서 내비게이션 바에 가려진다
import { readdirSync, readFileSync } from 'node:fs';
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
});
