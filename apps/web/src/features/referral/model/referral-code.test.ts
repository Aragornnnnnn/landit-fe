// 초대 코드 찾기·정리 규칙 테스트
import { describe, expect, it } from 'vitest';

import { findReferralCode, typedReferralCode } from './referral-code';

describe('findReferralCode', () => {
  it('공유 문구를 통째로 붙여넣으면 「초대 코드:」 뒤 코드를 찾는다', () => {
    const message =
      '랜딧에서 영어 회화 같이 해요 🙌\n가입할 때 아래 초대 코드를 넣으면 3,000원을 받아요\n\n초대 코드: K7QM3XPA\n\nhttps://landit.im/download';

    expect(findReferralCode(message)).toBe('K7QM3XPA');
  });

  it('코드만 붙여넣으면 그대로 찾는다', () => {
    expect(findReferralCode('K7QM3XPA')).toBe('K7QM3XPA');
  });

  it.each([
    ['소문자', 'k7qm3xpa'],
    ['하이픈', 'K7QM-3XPA'],
    ['공백', 'K7QM 3XPA'],
    ['앞뒤 공백', '  K7QM3XPA \n'],
  ])('%s이 섞여도 대문자 8자리로 찾는다', (_, text) => {
    expect(findReferralCode(text)).toBe('K7QM3XPA');
  });

  it('라벨 없이 문장 속에 있으면 8자리 낱말을 찾는다', () => {
    expect(findReferralCode('내 코드는 K7QM3XPA 이거야')).toBe('K7QM3XPA');
  });

  it('라벨이 있으면 문장 속 다른 8자리 낱말보다 라벨 뒤를 고른다', () => {
    const message = 'ABCDEFGH 말고 초대 코드: K7QM3XPA';

    expect(findReferralCode(message)).toBe('K7QM3XPA');
  });

  it('링크 속 글자는 코드로 보지 않는다', () => {
    expect(findReferralCode('https://landit.im/download')).toBeNull();
  });

  it('코드에 안 쓰는 글자(I·O·0·1)가 섞인 8자리는 코드로 보지 않는다', () => {
    expect(findReferralCode('PASSWORD 10102020')).toBeNull();
  });

  it('8자리보다 긴 낱말의 일부는 코드로 보지 않는다', () => {
    expect(findReferralCode('ABCDEFGHJK')).toBeNull();
  });

  it('코드가 없으면 null이다', () => {
    expect(findReferralCode('안녕하세요')).toBeNull();
  });
});

describe('typedReferralCode', () => {
  it('친 글자를 대문자로 바꾸고 코드에 안 쓰는 글자는 버린다', () => {
    expect(typedReferralCode('k7-qm 3!')).toBe('K7QM3');
  });

  it('8자를 넘기면 앞 8자만 남긴다', () => {
    expect(typedReferralCode('K7QM3XPAZZ')).toBe('K7QM3XPA');
  });
});
