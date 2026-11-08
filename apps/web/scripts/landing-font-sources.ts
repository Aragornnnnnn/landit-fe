// 랜딩 화면 글이 나오는 파일을 언어별로 모아 읽는다 (node 전용)
// 폰트 생성기와 누락 감시 테스트가 같은 파일 집합을 봐야 해서 여기 한 벌만 둔다
import { readdir, readFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { stripComments } from '../src/app/(public)/[lang]/_model/landing-font.ts';
import type { Locale } from '../src/shared/i18n/locale.ts';

const SRC_DIR = join(dirname(fileURLToPath(import.meta.url)), '../src');
const LANDING_DIR = join(SRC_DIR, 'app/(public)/[lang]');
// 화면 문구 파일 밖에서 글을 직접 쓰는 곳 — 시나리오 벽 제목·리뷰·언어 이름 같은 것
const CODE_DIRS = ['_ui', '_model'];

/** 그 언어 랜딩의 화면 문구 파일과, 글을 직접 쓰는 랜딩 코드(주석 뺌)를 읽는다 */
export const readLandingTexts = async (locale: Locale): Promise<string[]> => {
  const messages = await readFile(
    join(SRC_DIR, `shared/i18n/locales/${locale}/landing.json`),
    'utf-8',
  );
  const codeFiles = (
    await Promise.all(
      CODE_DIRS.map(async (dir) =>
        (await readdir(join(LANDING_DIR, dir)))
          .filter((name) => /\.tsx?$/.test(name) && !/\.test\./.test(name))
          .map((name) => join(LANDING_DIR, dir, name)),
      ),
    )
  ).flat();
  const code = await Promise.all(
    codeFiles.map(async (file) => stripComments(await readFile(file, 'utf-8'))),
  );
  return [messages, ...code];
};
