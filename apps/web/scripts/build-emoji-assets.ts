// 소스에 쓰인 이모지를 모아 토스페이스 SVG를 내려받고, 화면이 쓸 맵 파일을 만든다
// 실행: pnpm --filter web emoji
import { mkdir, readdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  extractEmoji,
  toSvgFileName,
} from '../src/shared/ui/emoji/emoji-source.ts';

const HERE = dirname(fileURLToPath(import.meta.url));
const SRC_DIR = join(HERE, '../src');
const OUT_FILE = join(SRC_DIR, 'shared/ui/emoji/emoji-map.ts');
const SVG_BASE =
  'https://raw.githubusercontent.com/toss/tossface/main/dist/svg';

/** src 아래 화면 코드를 전부 읽는다 — 테스트와 생성물 자신은 뺀다 */
const readSourceFiles = async (dir: string): Promise<string[]> => {
  const entries = await readdir(dir, { withFileTypes: true });
  const files = await Promise.all(
    entries.map(async (entry) => {
      const path = join(dir, entry.name);
      if (entry.isDirectory()) return readSourceFiles(path);
      if (!/\.tsx?$/.test(entry.name)) return [];
      if (entry.name.endsWith('.test.ts') || entry.name.endsWith('.test.tsx'))
        return [];
      if (path === OUT_FILE) return [];
      return [path];
    }),
  );
  return files.flat();
};

/** 토스가 주는 SVG에서 <svg> 껍데기를 벗기고 안쪽 마크업만 남긴다 — 화면에서는 우리 <svg>로 감싼다 */
const toInnerMarkup = (svg: string): string => {
  const inner = svg
    .replace(/^[\s\S]*?<svg[^>]*>/, '')
    .replace(/<\/svg>\s*$/, '');
  return inner.trim();
};

// 자동 수집에 안 걸리는 글자 — 영어 수준 카드가 토스페이스 숫자 글리프를 쓴다(EnglishLevelOptions).
// 소스의 모든 숫자를 긁을 수는 없으니 여기에만 적어둔다
const EXTRA_GLYPHS = ['1', '2', '3', '4', '5'];

const files = await readSourceFiles(SRC_DIR);
const sources = await Promise.all(files.map((file) => readFile(file, 'utf-8')));
const emojis = [
  ...new Set([...sources.flatMap(extractEmoji), ...EXTRA_GLYPHS]),
].sort();

await mkdir(dirname(OUT_FILE), { recursive: true });

const entries = await Promise.all(
  emojis.map(async (emoji) => {
    const fileName = toSvgFileName(emoji);
    const response = await fetch(`${SVG_BASE}/${fileName}`);
    if (!response.ok) {
      throw new Error(
        `토스페이스에 없는 이모지다 — ${emoji} (${fileName}, ${response.status})`,
      );
    }
    return [emoji, toInnerMarkup(await response.text())] as const;
  }),
);

const body = entries
  .map(
    ([emoji, markup]) =>
      `  '${emoji}': '${markup.replace(/\\/g, '\\\\').replace(/'/g, "\\'")}',`,
  )
  .join('\n');

await writeFile(
  OUT_FILE,
  `// 이 파일은 scripts/build-emoji-assets.ts가 만든다. 직접 고치지 말 것.
// 토스페이스(Tossface) 원본 SVG의 안쪽 마크업 — 모두 viewBox="0 0 40 40" 기준이다.
// Copyright © Viva Republica. https://toss.im/tossface/copyright

export const EMOJI_MARKUP: Record<string, string> = {
${body}
};
`,
  'utf-8',
);

console.log(`이모지 ${entries.length}개를 ${OUT_FILE}에 담았다.`);
