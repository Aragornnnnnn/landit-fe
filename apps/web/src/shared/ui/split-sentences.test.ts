// 토스트 문구를 문장 단위로 나눠 문장 사이에서만 줄을 바꾸는지 검증한다
import { describe, expect, it } from 'vitest';

import { splitSentences } from './split-sentences';

describe('splitSentences', () => {
  it('문장 끝 부호가 없으면 통째로 한 덩어리다', () => {
    expect(splitSentences('링크를 복사했어요')).toEqual(['링크를 복사했어요']);
  });

  it('한국어는 마침표 뒤 띄어쓰기에서 나누고 띄어쓰기는 앞 문장에 붙여 둔다', () => {
    expect(
      splitSentences('연결에 문제가 생겼어요. 잠시 후 다시 시도해 주세요'),
    ).toEqual(['연결에 문제가 생겼어요. ', '잠시 후 다시 시도해 주세요']);
  });

  it('일본어는 띄어쓰기 없이 。 뒤에서 나눈다', () => {
    expect(
      splitSentences(
        '接続に問題が発生しました。時間をおいて再度お試しください',
      ),
    ).toEqual(['接続に問題が発生しました。', '時間をおいて再度お試しください']);
  });

  it.each([
    ['말이 인식되지 않았어요? 다시 말해볼까요', '?'],
    ['고마워요! 또 보내 주세요', '!'],
    ['聞き取れませんか？もう一度どうぞ', '？'],
  ])('%s 처럼 %s 뒤에서도 나눈다', (message) => {
    expect(splitSentences(message)).toHaveLength(2);
  });

  it('문장 끝에 붙은 부호로는 빈 덩어리를 만들지 않는다', () => {
    expect(splitSentences('편지를 더 불러오지 못했어요.')).toEqual([
      '편지를 더 불러오지 못했어요.',
    ]);
  });

  it('숫자 사이 점(1.5배)에서는 나누지 않는다', () => {
    expect(splitSentences('1.5배로 들려줄게요')).toEqual([
      '1.5배로 들려줄게요',
    ]);
  });
});
