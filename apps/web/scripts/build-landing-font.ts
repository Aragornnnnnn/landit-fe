// 랜딩 화면에 쓰는 글자만 담은 Pretendard를 언어별로 만들고, 담은 글자 목록을 남긴다
// 실행: pnpm --filter web landing-font (랜딩 문구를 바꿔 누락 감시 테스트가 걸리면 다시 돌린다)
import { readFile, writeFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import subsetFont from 'subset-font';

import { landingGlyphs } from '../src/app/(public)/[lang]/_model/landing-font.ts';
import { readLandingTexts } from './landing-font-sources.ts';

const OUT_DIR = join(
  dirname(fileURLToPath(import.meta.url)),
  '../src/app/(public)/[lang]/_ui/fonts',
);
const LOCALES = ['ko', 'ja'] as const;

// 굵기 축(가변 폰트)과 숫자 폭 맞춤(tnum) 같은 글꼴 기능은 subset-font가 기본으로 그대로 둔다
const source = await readFile(
  createRequire(import.meta.url).resolve(
    'pretendard/dist/web/variable/woff2/PretendardVariable.woff2',
  ),
);

const glyphs: Record<string, string> = {};
for (const locale of LOCALES) {
  glyphs[locale] = landingGlyphs(locale, await readLandingTexts(locale));
  const font = await subsetFont(source, glyphs[locale], {
    targetFormat: 'woff2',
  });
  await writeFile(join(OUT_DIR, `landing-${locale}.woff2`), font);
  console.log(
    `landing-${locale}.woff2 — ${[...glyphs[locale]].length}자, ${Math.round(font.length / 1024)}KB`,
  );
}
await writeFile(
  join(OUT_DIR, 'landing-glyphs.json'),
  `${JSON.stringify(glyphs, null, 2)}\n`,
);
