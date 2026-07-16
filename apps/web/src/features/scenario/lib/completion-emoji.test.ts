// 카테고리 이름 → 완료 축하 이모지 매핑 검증 — 3종 매핑과 폴백
import { describe, expect, it } from 'vitest';

import { completionEmoji } from './completion-emoji';

describe('completionEmoji', () => {
  it('기숙사·여행·수업 카테고리에 맞는 이모지를 고른다', () => {
    expect(completionEmoji('기숙사').emoji).toBe('🏠');
    expect(completionEmoji('여행').emoji).toBe('🛬');
    expect(completionEmoji('수업').emoji).toBe('📚');
  });

  it('모르는 카테고리는 기본 이모지(🥰)로 폴백한다', () => {
    expect(completionEmoji('비즈니스').emoji).toBe('🥰');
    expect(completionEmoji('비즈니스').code).toBe('1f970');
  });
});
