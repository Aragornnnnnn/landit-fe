// 대화 기록 쌓기 규칙 테스트
import { describe, expect, it } from 'vitest';

import { recordExchange } from './conversation-log';

describe('recordExchange', () => {
  it('상대 말과 내 말을 그 순서로 기록 끝에 붙인다', () => {
    const log = recordExchange([], 'How are you?', 'Good!');

    expect(log.map(({ speaker, text }) => [speaker, text])).toEqual([
      ['PARTNER', 'How are you?'],
      ['ME', 'Good!'],
    ]);
  });

  it('내가 먼저 건 첫 턴이라 상대 말이 없으면 내 말만 붙인다', () => {
    const log = recordExchange([], null, 'Hi there!');

    expect(log.map(({ speaker }) => speaker)).toEqual(['ME']);
  });

  it('앞서 쌓인 기록과 겹치지 않는 id를 준다', () => {
    const first = recordExchange([], 'A', 'B');

    const log = recordExchange(first, 'C', 'D');

    expect(new Set(log.map(({ id }) => id)).size).toBe(4);
  });
});
