// 스몰톡 첫 안내 순서 — 래디의 두 문장 뒤에 화면의 실제 자리(받은 무료 시간 알약)를 차례로 비추는지 검증
import { describe, expect, it } from 'vitest';

import { introSentencesOf, introSpotlightsOf } from './intro-sentences';

const copy = {
  freeTalkBody: '여긴 <em>자유롭게 대화</em>하는 곳이에요',
  endingBody: '마무리 인사를 하면<br></br>대화가 끝나요',
};

const textOf = (parts: readonly (readonly [string, boolean?])[]) =>
  parts.map(([text]) => text).join('');

describe('introSentencesOf', () => {
  it('래디는 자유 대화와 마무리 인사 두 문장을 말한다', () => {
    // Given 안내 문구 원문
    // When 래디의 문장을 만들면
    const sentences = introSentencesOf(copy);

    // Then 두 문장이고, <em>은 금색 조각·<br>은 줄바꿈이 된다
    expect(sentences.map(({ parts }) => textOf(parts))).toEqual([
      '여긴 자유롭게 대화하는 곳이에요',
      '마무리 인사를 하면\n대화가 끝나요',
    ]);
    expect(sentences[0].parts).toContainEqual(['자유롭게 대화', true]);
    // 첫 문장 위엔 래디 대신 세 친구 얼굴이 선다
    expect(sentences[0].image).toBe('partners');
    expect(sentences[1].image).not.toBe('partners');
  });
});

describe('introSpotlightsOf', () => {
  it('무료 사용자는 받은 무료 시간을 비추고 끝낸다', () => {
    expect(introSpotlightsOf({ free: true, exhausted: false })).toEqual([
      'limit',
    ]);
  });

  it('한도가 없는 사용자는 비출 게 없다 — 래디의 말만 하고 확인 버튼으로 닫는다', () => {
    expect(introSpotlightsOf({ free: false, exhausted: false })).toEqual([]);
  });

  it('한도를 다 쓴 날도 알약이 없어 비추지 않는다', () => {
    expect(introSpotlightsOf({ free: true, exhausted: true })).toEqual([]);
  });
});
