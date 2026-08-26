// 소스에 쓰인 이모지를 모아 토스페이스 SVG를 내려받고, 화면이 쓸 맵 파일을 만든다
// 실행: pnpm --filter web emoji
import { writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  extractEmoji,
  NAMED_GLYPHS,
  toSvgFileName,
} from '../src/shared/ui/emoji/emoji-source.ts';
import { readEmojiSources } from './emoji-sources.ts';

const HERE = dirname(fileURLToPath(import.meta.url));
const OUT_FILE = join(HERE, '../src/shared/ui/emoji/emoji-map.ts');
const SVG_BASE =
  'https://raw.githubusercontent.com/toss/tossface/main/dist/svg';

/**
 * 토스가 주는 SVG에서 <svg> 껍데기를 벗기고 안쪽 마크업만 남긴다 — 화면에서는 우리 <svg>로 감싼다.
 * 좌표는 손대지 않는다. 소수 둘째 자리로 반올림하면 gzip 10%가 줄지만 성조기의 별 부분이 찢어진다
 */
const toInnerMarkup = (svg: string): string =>
  svg
    .replace(/^[\s\S]*?<svg[^>]*>/, '')
    .replace(/<\/svg>\s*$/, '')
    .trim();

const sources = await readEmojiSources();
// 맨숫자는 소스를 훑어서 찾을 수 없어서 닫힌 집합을 통째로 더한다 (emoji-source.ts 참고)
const emojis = [
  ...new Set([...sources.flatMap(extractEmoji), ...Object.keys(NAMED_GLYPHS)]),
].sort();

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
