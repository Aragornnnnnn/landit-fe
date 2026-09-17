// 모든 라우트가 이름을 갖는지 — 화면을 더하고 page-view.ts에 이름 등록을 빠뜨리면 여기서 걸린다.
// 이름이 없으면 폴백이 경로를 그대로 page_name으로 쓰는데, 그러면 이름 규칙(snake_case) 밖의 값이 쌓인다
import { readdirSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

import { toPageView } from './page-view';

const APP_DIR = join(import.meta.dirname, '../../app');

// app 폴더의 page.tsx를 모아 실제 주소로 바꾼다 — 라우트 그룹 (…)은 주소에 안 나오고, 동적 칸은 값으로 채운다
const collectRoutes = (dir: string, segments: string[] = []): string[] =>
  readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    if (entry.isDirectory()) {
      const isGroup = entry.name.startsWith('(');
      const next = entry.name.startsWith('[')
        ? [...segments, '7']
        : isGroup
          ? segments
          : [...segments, entry.name];
      return collectRoutes(join(dir, entry.name), next);
    }
    return entry.name === 'page.tsx' ? [`/${segments.join('/')}`] : [];
  });

describe('page_name 커버리지', () => {
  it('모든 화면이 경로가 아닌 이름으로 찍힌다', () => {
    const routes = collectRoutes(APP_DIR);
    // 폴더를 못 읽어 빈 배열이 되면 이 검사가 조용히 통과한다
    expect(routes.length).toBeGreaterThan(20);

    const unnamed = routes
      .map((pathname) => ({
        pathname,
        props: toPageView(pathname, new URLSearchParams()),
      }))
      // 계측 제외 화면(루트)은 null이다
      .filter(({ props }) => props?.page_name.startsWith('/'))
      .map(({ pathname }) => pathname);

    expect(unnamed).toEqual([]);
  });
});
