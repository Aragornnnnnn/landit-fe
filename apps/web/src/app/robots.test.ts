// 크롤러 규칙 — 검색·AI 크롤러가 막히지 않고, 공개할 필요 없는 주소만 막는지 검증
import { describe, expect, it } from 'vitest';

import robots from './robots';

const { rules, sitemap } = robots();
const ruleList = Array.isArray(rules) ? rules : [rules];

describe('robots', () => {
  it.each([
    'Googlebot',
    'Yeti',
    'GPTBot',
    'OAI-SearchBot',
    'ClaudeBot',
    'PerplexityBot',
    'Google-Extended',
  ])('%s에게 랜딩을 열어 둔다', (bot) => {
    const rule = ruleList.find((item) => item.userAgent === bot);

    expect(rule?.allow).toBe('/');
  });

  it('API와 로그인 콜백은 막고 공유 미리보기용 /download는 연다', () => {
    ruleList.forEach((rule) => {
      expect(rule.disallow).toEqual(['/api/', '/auth/']);
    });
  });

  it('사이트맵 주소를 알려 준다', () => {
    expect(sitemap).toBe('https://www.landit.im/sitemap.xml');
  });
});
