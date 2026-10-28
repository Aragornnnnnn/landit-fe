import { createTranslator } from 'next-intl';
import { describe, expect, it } from 'vitest';

import ja from '@/shared/i18n/locales/ja';
import ko from '@/shared/i18n/locales/ko';

import { toSessionTitle } from './session-summary';

const tKo = createTranslator({
  locale: 'ko',
  messages: ko,
  namespace: 'smallTalk',
});
const tJa = createTranslator({
  locale: 'ja',
  messages: ja,
  namespace: 'smallTalk',
});

describe('toSessionTitle', () => {
  it('서버가 뽑은 제목을 그대로 쓴다', () => {
    expect(toSessionTitle('카페 얘기', '2026-07-28T21:03:11', tKo, 'ko')).toBe(
      '카페 얘기',
    );
  });

  it('제목을 못 뽑았으면 날짜가 그 자리를 대신한다', () => {
    expect(toSessionTitle(null, '2026-07-28T21:03:11', tKo, 'ko')).toBe(
      '7월 28일의 대화',
    );
  });

  it('일본어 화면은 날짜도 문장도 일본어로 적는다', () => {
    expect(toSessionTitle(null, '2026-07-28T21:03:11', tJa, 'ja')).toBe(
      '7月28日の会話',
    );
  });
});
