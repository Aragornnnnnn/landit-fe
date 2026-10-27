// 문구 키 규칙 계약 — 표기·깊이·역할 단어·빈 문구·언어 간 키와 변수 일치를 코드로 강제한다 (docs/i18n.md 「키 규칙」)
import { describe, expect, it } from 'vitest';

import { LOCALES } from './locale';
import ja from './locales/ja';
import ko from './locales/ko';

type Tree = { [key: string]: string | Tree };

// 마지막 칸이 끝나야 하는 역할 단어 — 늘릴 때는 docs/i18n.md 목록도 같이 늘린다
const ROLES = [
  'title',
  'subtitle',
  'description',
  'body',
  'caption',
  'badge',
  'toast',
  'button',
  'link',
  'label',
  'placeholder',
  'hint',
  'error',
];

// 네임스페이스 포함 최대 3단계
const MAX_DEPTH = 3;

// { common: { closeLabel: '닫기' } } → [['common.closeLabel', '닫기']]
const flatten = (tree: Tree, prefix = ''): [string, string][] =>
  Object.entries(tree).flatMap(([key, value]) => {
    const path = prefix ? `${prefix}.${key}` : key;
    return typeof value === 'string' ? [[path, value]] : flatten(value, path);
  });

const koEntries = flatten(ko);
const jaEntries = flatten(ja);
const koByKey = new Map(koEntries);

const endsWithRole = (segment: string) =>
  ROLES.some(
    (role) =>
      segment === role ||
      segment.endsWith(role[0].toUpperCase() + role.slice(1)),
  );

// "<link>약관</link>에 {price}" → ['<link>', 'price'] 처럼 문장 안의 자리만 뽑는다.
// 변수는 영문으로 시작하는 이름만 본다 — plural·select 분기 안의 문장({7일 …})을 변수로 잘못 잡지 않게.
// 줄바꿈(<br>)은 세지 않는다 — 줄을 바꾸는 자리는 언어마다 글자 길이에 따라 다르다
const slotsOf = (message: string) =>
  [...message.matchAll(/\{([a-zA-Z_]\w*)|<(\w+)>/g)]
    .map((m) => m[1] ?? `<${m[2]}>`)
    .filter((slot) => slot !== '<br>')
    .sort();

describe('문구 파일 계약', () => {
  it('스스로 닫는 태그(<br/>)를 쓰지 않는다 — next-intl이 태그로 읽지 않고 글자 그대로 내보낸다', () => {
    for (const [path, message] of [...koEntries, ...jaEntries]) {
      expect(message, path).not.toMatch(/<\w+\s*\/>/);
    }
  });

  it('언어마다 묶음 파일이 있다', async () => {
    for (const locale of LOCALES) {
      await expect(import(`./locales/${locale}.ts`)).resolves.toBeDefined();
    }
  });

  it('한국어와 일본어의 네임스페이스가 같다', () => {
    expect(Object.keys(ja).sort()).toEqual(Object.keys(ko).sort());
  });

  it('키는 camelCase 영어이고 순번이 없다', () => {
    for (const [path] of [...koEntries, ...jaEntries]) {
      for (const segment of path.split('.')) {
        expect(segment, path).toMatch(/^[a-z][a-zA-Z]*$/);
      }
    }
  });

  it(`키는 네임스페이스 포함 ${MAX_DEPTH}단계 이하다`, () => {
    for (const [path] of koEntries) {
      expect(path.split('.').length, path).toBeLessThanOrEqual(MAX_DEPTH);
    }
  });

  it('마지막 칸이 역할 단어로 끝난다', () => {
    for (const [path] of koEntries) {
      expect(endsWithRole(path.split('.').at(-1)!), path).toBe(true);
    }
  });

  it('빈 문구가 없다', () => {
    for (const [path, message] of [...koEntries, ...jaEntries]) {
      expect(message.trim(), path).not.toBe('');
    }
  });

  it('일본어에만 있는 키가 없다', () => {
    for (const [path] of jaEntries) {
      expect(koByKey.has(path), path).toBe(true);
    }
  });

  it('같은 키의 변수·태그가 언어끼리 같다', () => {
    for (const [path, message] of jaEntries) {
      const koMessage = koByKey.get(path);
      if (koMessage === undefined) continue;
      expect(slotsOf(message), path).toEqual(slotsOf(koMessage));
    }
  });
});
