// 대화 기록 쌓기 규칙 테스트
import { describe, expect, it } from 'vitest';

import { recordExchange } from './conversation-log';

const partner = (text: string) => ({
  speaker: 'PARTNER' as const,
  text,
  translation: null,
  thought: null,
  source: { content: text },
  turnIndex: 0,
});

describe('recordExchange', () => {
  it('상대 말과 내 말을 그 순서로 기록 끝에 붙인다', () => {
    const log = recordExchange([], partner('How are you?'), 'Good!');

    expect(log.map(({ speaker, text }) => [speaker, text])).toEqual([
      ['PARTNER', 'How are you?'],
      ['ME', 'Good!'],
    ]);
  });

  it('상대 말은 해석·속마음·음원·턴 번호를 함께 남긴다 — 지난 말풍선에서도 다시 듣고 해석을 펼친다', () => {
    const opener = {
      speaker: 'PARTNER' as const,
      text: 'How are you?',
      translation: '잘 지내?',
      thought: { text: '반갑네.', type: 'GOOD' as const },
      source: { content: 'How are you?', questionAudioUrl: 'q.mp3' },
      turnIndex: 2,
    };

    const [entry] = recordExchange([], opener, 'Good!');

    expect(entry).toEqual({ ...opener, id: 0 });
  });

  it('내가 먼저 건 첫 턴이면 상황 안내를 내 말 앞에 남긴다 — 대화가 쌓이면 위로 밀려 흐려진다', () => {
    const log = recordExchange(
      [],
      { speaker: 'SITUATION', text: '복도에서 새 룸메이트와 마주쳤어요.' },
      'Hi there!',
    );

    expect(log.map(({ speaker }) => speaker)).toEqual(['SITUATION', 'ME']);
  });

  it('앞서 건넨 말이 없으면 내 말만 붙인다', () => {
    const log = recordExchange([], null, 'Hi there!');

    expect(log.map(({ speaker }) => speaker)).toEqual(['ME']);
  });

  it('앞서 쌓인 기록과 겹치지 않는 id를 준다', () => {
    const first = recordExchange([], partner('A'), 'B');

    const log = recordExchange(first, partner('C'), 'D');

    expect(new Set(log.map(({ id }) => id)).size).toBe(4);
  });
});
