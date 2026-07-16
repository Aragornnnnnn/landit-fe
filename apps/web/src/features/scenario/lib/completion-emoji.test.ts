// 카테고리 이름 → 완료 축하 이모지 매핑 검증 — 키워드 매칭과 폴백
import { describe, expect, it } from 'vitest';

import { completionEmoji } from './completion-emoji';

describe('completionEmoji', () => {
  it('카테고리 이름에 키워드가 들어 있으면 맞는 이모지를 고른다', () => {
    expect(completionEmoji('여행').emoji).toBe('🛬');
    expect(completionEmoji('여행 준비').emoji).toBe('🛬');
    expect(completionEmoji('카페').code).toBe('2615');
    expect(completionEmoji('음식점에서').emoji).toBe('🍜');
    expect(completionEmoji('쇼핑').emoji).toBe('🛒');
  });

  it('매칭되는 키워드가 없으면 기본 이모지(🥰)로 폴백한다', () => {
    expect(completionEmoji('비즈니스').emoji).toBe('🥰');
    expect(completionEmoji('비즈니스').code).toBe('1f970');
  });
});
