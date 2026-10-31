// 롤플레이 입력 완료 판정 검증 — 세 칸이 모두 차야 시작할 수 있다
import { describe, expect, it } from 'vitest';

import { EMPTY_DRAFT, isDraftReady } from './roleplay-draft';

describe('isDraftReady', () => {
  it('세 칸이 모두 차 있으면 시작할 수 있다', () => {
    const draft = {
      myRole: '커피를 주문하는 손님',
      partnerRole: '바리스타',
      situation: '새 메뉴 추천받기',
    };

    expect(isDraftReady(draft)).toBe(true);
  });

  it('처음 빈 상태면 시작할 수 없다', () => {
    expect(isDraftReady(EMPTY_DRAFT)).toBe(false);
  });

  it.each([['myRole'], ['partnerRole'], ['situation']] as const)(
    '%s 칸이 공백뿐이면 시작할 수 없다 — 띄어쓰기만 친 칸은 빈 칸이다',
    (field) => {
      const draft = {
        myRole: '손님',
        partnerRole: '바리스타',
        situation: '주문하기',
        [field]: '  \n ',
      };

      expect(isDraftReady(draft)).toBe(false);
    },
  );
});
