// 롱 페이월 고정 콘텐츠의 계약 — 예문 카드는 짚을 표현이 문장 안에 그대로 있어야 주황 강조가 제자리에 앉는다
import { describe, expect, it } from 'vitest';

import {
  EXAMPLE_CARDS,
  EXAMPLE_LANDING_INDEX,
  maskName,
} from './paywall-content';

describe('EXAMPLE_CARDS', () => {
  it('짚을 표현이 모든 문장 안에 한 번씩 들어 있다', () => {
    EXAMPLE_CARDS.forEach(({ sentence, highlight }) => {
      expect(sentence.split(highlight)).toHaveLength(2);
    });
  });

  it('카드마다 그림이 다르다', () => {
    const images = EXAMPLE_CARDS.map((card) => card.image);

    expect(new Set(images).size).toBe(images.length);
  });

  it('멈춰 설 카드 뒤에도 카드가 남아 줄이 끊겨 보이지 않는다', () => {
    expect(
      EXAMPLE_CARDS.length - 1 - EXAMPLE_LANDING_INDEX,
    ).toBeGreaterThanOrEqual(3);
  });
});

describe('maskName', () => {
  it('짧은 이름은 첫 글자만 남기고 가린다', () => {
    expect(maskName('마먀먀먀')).toBe('마***');
    expect(maskName('리움07')).toBe('리***');
  });

  it('다섯 글자 넘는 이름은 앞 두 글자를 남긴다', () => {
    expect(maskName('qwaszx96')).toBe('qw******');
  });

  it('한 글자 이름도 가려진 자리가 하나는 생긴다', () => {
    expect(maskName('김')).toBe('김*');
  });
});
