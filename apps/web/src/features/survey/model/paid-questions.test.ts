// 결제자 설문 만족 기능 보기 — 롤플레이는 스위치를 켠 때만 보인다
import { afterEach, describe, expect, it, vi } from 'vitest';

import { likedFeatureOptions } from './paid-questions';

afterEach(() => {
  vi.unstubAllEnvs();
  vi.resetModules();
});

describe('likedFeatureOptions', () => {
  it('스위치가 꺼져 있으면 롤플레이를 보여 주지 않는다', () => {
    expect(likedFeatureOptions(false)).not.toContain('롤플레이');
  });

  it('스위치를 켜면 스몰톡 바로 뒤에 롤플레이를 보여 준다', () => {
    const options = likedFeatureOptions(true);

    expect(options[options.indexOf('스몰톡') + 1]).toBe('롤플레이');
  });
});

describe('PAID_QUESTIONS', () => {
  it.each([
    ['true', true],
    ['false', false],
  ])(
    '환경변수가 %s면 만족 기능 문항의 롤플레이 노출이 그에 따른다',
    async (value, shown) => {
      // Given
      vi.stubEnv('NEXT_PUBLIC_PAID_SURVEY_ROLEPLAY', value);
      vi.resetModules();

      // When
      const { PAID_QUESTIONS } = await import('./paid-questions');
      const question = PAID_QUESTIONS.find(({ id }) => id === 'liked_features');

      // Then
      expect(
        question?.kind === 'multi' && question.options.includes('롤플레이'),
      ).toBe(shown);
    },
  );
});
