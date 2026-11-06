// 닉네임 입력 검증 — 백엔드 NicknameValidator와 같은 규칙으로 저장 전에 거른다
import { describe, expect, it } from 'vitest';

import {
  NICKNAME_MAX_LENGTH,
  nicknameDisplaySize,
  validateNickname,
} from './nickname';

describe('validateNickname', () => {
  it('앞뒤 공백을 떼고 한글·영문·숫자·단어 사이 공백을 받는다', () => {
    expect(validateNickname('  랜딧 Lover 7  ')).toEqual({
      ok: true,
      value: '랜딧 Lover 7',
    });
  });

  it('공백만 있으면 비었다고 본다', () => {
    expect(validateNickname('   ')).toEqual({ ok: false, reason: 'empty' });
  });

  it('글자 수는 눈에 보이는 글자 기준으로 10자까지 받는다', () => {
    expect(validateNickname('가'.repeat(NICKNAME_MAX_LENGTH)).ok).toBe(true);
    expect(validateNickname('가'.repeat(NICKNAME_MAX_LENGTH + 1))).toEqual({
      ok: false,
      reason: 'too_long',
    });
  });

  it.each([
    ['이모지', '래디😀'],
    ['밑줄', 'landit_fan'],
    ['마침표', 'jun.seo'],
    ['줄바꿈', '랜\n딧'],
    ['폭 없는 공백', '랜\u200B딧'],
    ['한글 채움 문자', '\u3164'],
  ])('%s이 섞이면 거절한다', (_, input) => {
    expect(validateNickname(input)).toEqual({
      ok: false,
      reason: 'invalid_char',
    });
  });
});

describe('nicknameDisplaySize', () => {
  it('짧은 이름은 큰 글자로 보여준다', () => {
    expect(nicknameDisplaySize('준서')).toBe('lg');
    expect(nicknameDisplaySize('가나다라마바사아')).toBe('lg');
    expect(nicknameDisplaySize('Kim Junseo')).toBe('lg');
  });

  it('큰 글자로 한 줄에 안 들어가면 한 단계 줄여 한 줄을 지킨다', () => {
    expect(nicknameDisplaySize('가'.repeat(NICKNAME_MAX_LENGTH))).toBe('md');
    expect(nicknameDisplaySize('Alexander Hamilton')).toBe('md');
  });

  it('가입 때 받은 긴 이름은 가장 작은 글자로 줄을 넘긴다', () => {
    expect(nicknameDisplaySize('가'.repeat(20))).toBe('sm');
    expect(nicknameDisplaySize('Kim Junseo From Google Account')).toBe('sm');
  });
});
