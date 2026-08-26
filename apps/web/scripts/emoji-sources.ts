// 이모지를 찾을 화면 코드를 모아 읽는다 (node 전용)
// 에셋 생성기와 누락 감시 테스트가 같은 파일 집합을 봐야 해서 여기 한 벌만 둔다
import { readdir, readFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const SRC_DIR = join(dirname(fileURLToPath(import.meta.url)), '../src');

/** src 아래 화면 코드의 내용을 전부 읽는다 — 테스트와 생성물 자신은 뺀다 */
export const readEmojiSources = async (): Promise<string[]> => {
  const entries = await readdir(SRC_DIR, {
    recursive: true,
    withFileTypes: true,
  });
  const files = entries.filter(
    (entry) =>
      entry.isFile() &&
      /\.tsx?$/.test(entry.name) &&
      !/\.test\.tsx?$/.test(entry.name) &&
      entry.name !== 'emoji-map.ts',
  );

  return Promise.all(
    files.map((entry) => readFile(join(entry.parentPath, entry.name), 'utf-8')),
  );
};
