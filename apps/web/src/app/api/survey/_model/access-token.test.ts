import { describe, expect, it } from 'vitest';

import { readUserId } from './access-token';

const tokenWith = (claims: unknown) =>
  `header.${Buffer.from(JSON.stringify(claims)).toString('base64url')}.sig`;

describe('readUserId', () => {
  it('sub에 든 숫자 문자열을 유저 id로 읽는다', () => {
    expect(readUserId(tokenWith({ sub: '42', type: 'access' }))).toBe(42);
  });

  it.each([
    ['sub가 없으면', tokenWith({ type: 'access' })],
    ['sub가 숫자가 아니면', tokenWith({ sub: 'me' })],
    ['sub가 안전 정수 범위를 넘으면', tokenWith({ sub: '9007199254740993' })],
    ['payload가 JSON이 아니면', 'header.not-json.sig'],
    ['토큰 모양이 아니면', 'garbage'],
  ])('%s 없는 것으로 본다', (_, token) => {
    expect(readUserId(token)).toBeNull();
  });
});
