// assets/widgets/*.webp·ja/*.webp 목록으로 src/widgets/art/widget-art.ts(정적 require 매니페스트)를 다시 만든다
// 사용: node scripts/generate-widget-art.mjs [버전]  — 버전을 올리면 앱이 공유 디렉터리에 아트를 다시 복사한다
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const assetsDir = path.join(root, 'assets/widgets');
const outFile = path.join(root, 'src/widgets/art/widget-art.ts');

const currentVersion = (() => {
  const match = fs
    .readFileSync(outFile, 'utf8')
    .match(/WIDGET_ART_VERSION = (\d+)/);
  return match ? Number(match[1]) : 0;
})();
const version = process.argv[2] ? Number(process.argv[2]) : currentVersion;

const webpIn = (dir) =>
  fs
    .readdirSync(dir)
    .filter((file) => file.endsWith('.webp'))
    .sort();
const files = webpIn(assetsDir);
// 일본어 아트 — 글자가 든 그림만 있다. 없는 키(열매 등)는 한국어 그림을 같이 쓴다
const jaFiles = webpIn(path.join(assetsDir, 'ja'));
const entries = (list, dir) =>
  list.map(
    (file) =>
      `  '${file.replace('.webp', '')}': require('../../../assets/widgets/${dir}${file}'),`,
  );

const lines = [
  '// 위젯 아트 매니페스트 — 상태×사이즈별 webp를 정적 require로 묶는다',
  '// 생성 파일: scripts/generate-widget-art.mjs 로 다시 만든다 (아트 원본 = 피그마 "🧩 위젯 Final" 보드)',
  `export const WIDGET_ART_VERSION = ${version};`,
  '',
  'export const WIDGET_ART: Record<string, number> = {',
  ...entries(files, ''),
  '};',
  '',
  'export const WIDGET_ART_JA: Record<string, number> = {',
  ...entries(jaFiles, 'ja/'),
  '};',
  '',
];
fs.writeFileSync(outFile, lines.join('\n'));
console.log(
  `widget-art.ts: ${files.length} + ja ${jaFiles.length} entries, version ${version}`,
);
