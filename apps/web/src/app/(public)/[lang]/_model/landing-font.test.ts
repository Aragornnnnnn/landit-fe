// 랜딩 전용 폰트에 담을 글자 고르기 — 언어별로 담을 글자와 빼는 글자, 화면 문구가 바뀌어도 폰트가 따라오는지 검증
import { describe, expect, it } from 'vitest';

import LANDING_GLYPHS from '../_ui/fonts/landing-glyphs.json';
import { readLandingTexts } from '../../../../../scripts/landing-font-sources.ts';
import { landingGlyphs, stripComments } from './landing-font';

describe('stripComments', () => {
  it('줄 주석과 블록 주석의 글은 지우고 코드 속 문자열은 남긴다', () => {
    // Given 주석과 문자열이 섞인 소스
    const source = [
      '// 첫 화면 그림',
      "const a = '안녕';",
      '/* 바닥글 */',
      '{/* 말풍선 */}<p>You made my day!</p>',
      "const url = 'https://www.landit.im';",
    ].join('\n');

    // When 주석을 지우면
    const code = stripComments(source);

    // Then 주석 글은 사라지고 문자열과 주소는 그대로다
    expect(code).not.toContain('첫 화면');
    expect(code).not.toContain('바닥글');
    expect(code).not.toContain('말풍선');
    expect(code).toContain('안녕');
    expect(code).toContain('You made my day!');
    expect(code).toContain('https://www.landit.im');
  });
});

describe('landingGlyphs', () => {
  it('글자를 한 번씩만, 정렬해서 담는다', () => {
    const glyphs = landingGlyphs('ko', ['나가나', '가']);

    expect(glyphs).toContain('가');
    expect([...glyphs].filter((c) => c === '가')).toHaveLength(1);
    expect(glyphs).toBe([...glyphs].sort().join(''));
  });

  it('줄바꿈·탭 같은 제어 문자는 담지 않는다', () => {
    expect(landingGlyphs('ko', ['가\n\t나'])).not.toMatch(/[\n\t]/);
  });

  it('문구에 없어도 영문·숫자·기본 기호는 늘 담는다', () => {
    // 숫자 연출(CountUp)이나 짧은 영어 문구가 바뀌어도 폰트를 다시 만들 필요가 없게
    const glyphs = landingGlyphs('ja', []);

    expect(glyphs).toContain('A');
    expect(glyphs).toContain('9');
    expect(glyphs).toContain('+');
    expect(glyphs).toContain(' ');
  });

  it('한국어 폰트엔 일본어 글자를, 일본어 폰트엔 한글을 담지 않는다', () => {
    // Given 두 언어 문구가 한 파일에 같이 있는 시나리오 벽처럼
    const texts = ['카페에서 주문하기 カフェで注文する 日本語 한국어'];

    // Then 남의 언어 글자는 시스템 글꼴로 그린다 — 언어 바꾸기 링크 한 줄 때문에 폰트를 키우지 않는다
    const ko = landingGlyphs('ko', texts);
    expect(ko).toContain('카');
    expect(ko).not.toMatch(/[カ注日]/);

    const ja = landingGlyphs('ja', texts);
    expect(ja).toContain('カ');
    expect(ja).toContain('注');
    expect(ja).not.toMatch(/[카한]/);
  });
});

describe('랜딩 폰트 커버리지', () => {
  it.each(['ko', 'ja'] as const)(
    '%s 랜딩에 쓰인 글자는 전부 랜딩 폰트에 들어 있다',
    async (locale) => {
      const needed = landingGlyphs(locale, await readLandingTexts(locale));
      const prepared = new Set(LANDING_GLYPHS[locale]);

      const missing = [...needed].filter((c) => !prepared.has(c)).join('');

      // 랜딩 문구를 바꾸면 여기서 걸린다 — `pnpm --filter web landing-font`로 폰트를 다시 만들면 된다
      expect(missing).toBe('');
    },
  );
});
