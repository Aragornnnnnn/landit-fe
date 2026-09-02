// 답변 규칙 — 복수 선택 토글, 조건 문항 노출, 제출 페이로드(기타·주관식 다듬기)
import { describe, expect, it } from 'vitest';

import { toggleChoice, toSubmission, visibleQuestions } from './answers';
import type { Question } from './questions';

const single: Question = {
  id: 'a',
  kind: 'single',
  title: '',
  options: ['x', 'y'],
};
const text: Question = { id: 'c', kind: 'text', title: '', placeholder: '' };
const conditional: Question = {
  id: 'd',
  kind: 'single',
  title: '',
  options: ['p'],
  showIf: { questionId: 'a', equals: 'x' },
};

describe('toggleChoice', () => {
  it('안 고른 선택지를 누르면 더한다', () => {
    expect(toggleChoice(['x'], 'y')).toEqual(['x', 'y']);
  });

  it('이미 고른 선택지를 누르면 뺀다', () => {
    expect(toggleChoice(['x', 'y'], 'x')).toEqual(['y']);
  });

  it('아직 답이 없으면 그 선택지 하나로 시작한다', () => {
    expect(toggleChoice(undefined, 'x')).toEqual(['x']);
  });
});

describe('visibleQuestions', () => {
  it('조건 문항은 앞 문항의 답이 맞을 때만 들어간다', () => {
    const questions = [single, conditional, text];

    expect(visibleQuestions(questions, { a: 'x' }).map((q) => q.id)).toEqual([
      'a',
      'd',
      'c',
    ]);
    expect(visibleQuestions(questions, { a: 'y' }).map((q) => q.id)).toEqual([
      'a',
      'c',
    ]);
  });
});

describe('toSubmission', () => {
  it('주관식은 앞뒤 공백을 지우고, 비어 있으면 아예 싣지 않는다', () => {
    const questions = [single, text];

    expect(toSubmission(questions, { a: 'x', c: '  바람  ' })).toEqual({
      a: 'x',
      c: '바람',
    });
    expect(toSubmission(questions, { a: 'x', c: '   ' })).toEqual({ a: 'x' });
  });

  it('기타를 골랐을 때 직접 쓴 내용은 _other 키로 함께 싣는다', () => {
    expect(
      toSubmission([single], { a: '기타', a_other: ' 친구 소개 ' }),
    ).toEqual({ a: '기타', a_other: '친구 소개' });
  });

  it('기타를 안 골랐으면 남아 있던 직접 입력은 버린다', () => {
    expect(toSubmission([single], { a: 'x', a_other: '옛 입력' })).toEqual({
      a: 'x',
    });
  });

  it('조건에 안 맞아 숨은 문항의 답은 버린다', () => {
    expect(toSubmission([single, conditional], { a: 'y', d: 'p' })).toEqual({
      a: 'y',
    });
  });
});
