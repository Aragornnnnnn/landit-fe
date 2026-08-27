import { describe, expect, it } from 'vitest';

import { readEmojiSources } from '../../../../scripts/emoji-sources.ts';
import { EMOJI_MARKUP } from './emoji-map';
import { extractEmoji, NAMED_GLYPHS } from './emoji-source';

describe('이모지 에셋 커버리지', () => {
  it('화면에 쓰인 이모지는 전부 그림이 준비돼 있다', async () => {
    const sources = await readEmojiSources();
    const used = [...new Set(sources.flatMap(extractEmoji))];

    const missing = used.filter((emoji) => !EMOJI_MARKUP[emoji]);

    // 새 이모지를 쓰면 여기서 걸린다 — `pnpm --filter web emoji`로 에셋을 다시 만들면 된다
    expect(missing).toEqual([]);
  });

  it('소스를 훑어서는 못 찾는 글자도 준비돼 있다', async () => {
    // 맨숫자는 이모지로 안 잡히는데 영어 수준 카드가 토스페이스 숫자 글리프를 쓴다.
    // 닫힌 집합이라 통째로 확인해, 수준이 하나 늘어도 그 숫자가 빠지지 않게 한다
    const missing = Object.keys(NAMED_GLYPHS).filter(
      (glyph) => !EMOJI_MARKUP[glyph],
    );

    expect(missing).toEqual([]);
  });
});
