import { readdir, readFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

import { EMOJI_MARKUP } from './emoji-map';
import { extractEmoji } from './emoji-source';

const SRC_DIR = join(dirname(fileURLToPath(import.meta.url)), '../../..');

/** 화면 코드를 훑는다 — 테스트와 생성물 자신은 뺀다 */
const readScreenSources = async (dir: string): Promise<string[]> => {
  const entries = await readdir(dir, { withFileTypes: true });
  const found = await Promise.all(
    entries.map(async (entry) => {
      const path = join(dir, entry.name);
      if (entry.isDirectory()) return readScreenSources(path);
      if (!/\.tsx?$/.test(entry.name)) return [];
      if (/\.test\.tsx?$/.test(entry.name)) return [];
      if (entry.name === 'emoji-map.ts') return [];
      return [await readFile(path, 'utf-8')];
    }),
  );
  return found.flat();
};

describe('이모지 에셋 커버리지', () => {
  it('화면에 쓰인 이모지는 전부 그림이 준비돼 있다', async () => {
    const sources = await readScreenSources(SRC_DIR);
    const used = [...new Set(sources.flatMap(extractEmoji))];

    const missing = used.filter((emoji) => !EMOJI_MARKUP[emoji]);

    // 새 이모지를 쓰면 여기서 걸린다 — `pnpm --filter web emoji`로 에셋을 다시 만들면 된다
    expect(missing).toEqual([]);
  });
});
