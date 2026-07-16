// 복습 영작 입력 모델 검증 — 자동 넘김·지우기·조기 이동·단어 포커스·완성/채점
import { describe, expect, it } from 'vitest';

import {
  advance,
  appendLetter,
  applyComposition,
  backspace,
  diffComposition,
  emptyState,
  firstWrong,
  focusWord,
  gradePartial,
  gradeWords,
  isComplete,
  normalizeQuotes,
  parseInputEvent,
} from './reviewInput';

// 정답: "I got a good deal" → 단어 길이 [1, 3, 1, 4, 4]
const LENGTHS = [1, 3, 1, 4, 4];
const ANSWER = ['I', 'got', 'a', 'good', 'deal'];

describe('appendLetter', () => {
  it('활성 단어에 글자를 채우고, 정답 글자 수만큼 차면 다음 단어로 넘긴다', () => {
    const s = appendLetter(emptyState(5), 'i', LENGTHS);
    expect(s.typed[0]).toBe('i');
    expect(s.focus).toBe(1); // "I"(1글자)가 다 차서 다음 단어로
  });

  it('단어가 덜 찼으면 focus를 유지한다', () => {
    let s = appendLetter(emptyState(5), 'i', LENGTHS); // focus=1
    s = appendLetter(s, 'g', LENGTHS);
    expect(s.typed[1]).toBe('g');
    expect(s.focus).toBe(1);
  });

  it('마지막 단어가 차도 더 넘어가지 않고, 넘치는 입력은 무시한다', () => {
    let s: ReturnType<typeof emptyState> = {
      typed: ['I', 'got', 'a', 'good', 'dea'],
      focus: 4,
    };
    s = appendLetter(s, 'l', LENGTHS);
    expect(s.typed[4]).toBe('deal');
    expect(s.focus).toBe(4);
    s = appendLetter(s, 'x', LENGTHS); // 꽉 참 → 무시
    expect(s.typed[4]).toBe('deal');
  });

  it('꽉 찬 단어에 포커스가 있으면 입력을 무시한다(백스페이스로 지운 뒤 수정)', () => {
    const before = { typed: ['I', '', '', '', ''], focus: 0 };
    // "I"는 꽉 참 → 클릭해서 고른 뒤 타이핑해도 다른 단어로 새지 않는다
    expect(appendLetter(before, 'g', LENGTHS)).toEqual(before);
  });
});

describe('backspace', () => {
  it('활성 단어의 마지막 글자를 지운다', () => {
    const s = backspace({ typed: ['I', 'go', '', '', ''], focus: 1 });
    expect(s.typed[1]).toBe('g');
    expect(s.focus).toBe(1);
  });

  it('활성 단어가 비어 있으면 앞 단어로 넘어가 지운다', () => {
    const s = backspace({ typed: ['I', '', '', '', ''], focus: 1 });
    expect(s.typed[0]).toBe('');
    expect(s.focus).toBe(0);
  });
});

describe('advance', () => {
  it('현재 단어에 입력이 있으면 다음 단어로 이동한다', () => {
    const s = advance({ typed: ['I', 'go', '', '', ''], focus: 1 }, 5);
    expect(s.focus).toBe(2);
  });

  it('현재 단어가 비어 있으면 이동하지 않는다', () => {
    const s = advance({ typed: ['I', '', '', '', ''], focus: 1 }, 5);
    expect(s.focus).toBe(1);
  });
});

describe('focusWord', () => {
  it('지정한 단어로 focus를 옮긴다', () => {
    expect(focusWord(emptyState(5), 3).focus).toBe(3);
  });
});

describe('isComplete', () => {
  it('모든 단어가 정답 글자 수만큼 차야 확인 가능하다', () => {
    expect(
      isComplete(
        { typed: ['I', 'got', 'a', 'good', 'deal'], focus: 4 },
        LENGTHS,
      ),
    ).toBe(true);
  });

  it('글자가 덜 찬 단어가 있으면 확인 불가하다', () => {
    // 마지막 단어 "deal"(4글자)에 3글자만 입력된 상태
    expect(
      isComplete(
        { typed: ['I', 'got', 'a', 'good', 'dea'], focus: 4 },
        LENGTHS,
      ),
    ).toBe(false);
  });

  it('빈 단어가 있으면 확인 불가하다', () => {
    expect(
      isComplete(
        { typed: ['I', 'got', '', 'good', 'deal'], focus: 2 },
        LENGTHS,
      ),
    ).toBe(false);
  });

  it('단어가 하나도 없으면 확인 불가하다(빈 정답 방어)', () => {
    expect(isComplete({ typed: [], focus: 0 }, [])).toBe(false);
  });
});

describe('gradePartial', () => {
  it('입력이 정답의 접두사면 올바른 경로로 본다(빈 단어 포함)', () => {
    expect(gradePartial(['I', 'go', '', '', ''], ANSWER)).toEqual([
      true,
      true,
      true,
      true,
      true,
    ]);
  });

  it('입력이 정답 경로를 벗어난 단어만 틀림으로 표시한다', () => {
    expect(gradePartial(['I', 'ga', '', 'good', 'x'], ANSWER)).toEqual([
      true,
      false,
      true,
      true,
      false,
    ]);
  });

  it('대소문자·스마트따옴표는 무시한다', () => {
    expect(gradePartial(['don’'], ["don't"])).toEqual([true]);
  });
});

describe('gradeWords / firstWrong', () => {
  it('대소문자를 무시하고 단어별로 채점한다', () => {
    const ok = gradeWords(['i', 'got', 'a', 'good', 'deal'], ANSWER);
    expect(ok).toEqual([true, true, true, true, true]);
  });

  it('틀린 단어를 표시하고 첫 오답 인덱스를 찾는다', () => {
    const ok = gradeWords(['I', 'get', 'a', 'good', 'deal'], ANSWER);
    expect(ok[1]).toBe(false);
    expect(firstWrong(ok)).toBe(1);
  });

  it('모두 맞으면 첫 오답은 -1이다', () => {
    expect(firstWrong([true, true, true])).toBe(-1);
  });

  it('정답 쪽에 스마트 아포스트로피가 있어도 곧은 입력과 맞는다', () => {
    // BE가 "don’t"(스마트)를 내려줘도, 사용자가 "don't"(곧은)로 치면 정답이어야 한다
    expect(gradeWords(["don't"], ['don’t'])).toEqual([true]);
  });
});

describe('normalizeQuotes', () => {
  it('스마트 아포스트로피를 곧은 아포스트로피로 바꾼다', () => {
    expect(normalizeQuotes('’')).toBe("'");
  });

  it('스마트 큰따옴표를 곧은 큰따옴표로 바꾼다', () => {
    expect(normalizeQuotes('”')).toBe('"');
  });

  it('일반 글자는 그대로 둔다', () => {
    expect(normalizeQuotes('a')).toBe('a');
  });
});

describe('parseInputEvent', () => {
  it('지우기 계열 inputType은 backspace 액션 하나로 바꾼다', () => {
    expect(parseInputEvent('deleteContentBackward', '')).toEqual([
      { kind: 'backspace' },
    ]);
  });

  it('글자 삽입은 letter 액션으로, 스마트따옴표는 곧은 따옴표로 정규화한다', () => {
    expect(parseInputEvent('insertText', '’')).toEqual([
      { kind: 'letter', letter: "'" },
    ]);
  });

  it('스페이스는 space 액션으로 바꾼다', () => {
    expect(parseInputEvent('insertText', ' ')).toEqual([{ kind: 'space' }]);
  });

  it('여러 글자(붙여넣기·자동완성)를 순서대로 액션으로 편다', () => {
    expect(parseInputEvent('insertFromPaste', 'ab')).toEqual([
      { kind: 'letter', letter: 'a' },
      { kind: 'letter', letter: 'b' },
    ]);
  });

  it('줄바꿈 문자는 액션에서 걸러낸다', () => {
    expect(parseInputEvent('insertText', '\n')).toEqual([]);
  });

  it('inputType이 비었어도 데이터가 있으면 삽입으로 본다(일부 안드로이드 키보드)', () => {
    expect(parseInputEvent('', 'x')).toEqual([{ kind: 'letter', letter: 'x' }]);
  });
});

describe('diffComposition', () => {
  it('조합 문자열이 한 글자 늘면 그 글자만 letter 액션으로 낸다(라이브 반영)', () => {
    expect(diffComposition('go', 'goo')).toEqual([
      { kind: 'letter', letter: 'o' },
    ]);
  });

  it('처음 조합이면 빈 문자열에서 시작해 글자를 순서대로 편다', () => {
    expect(diffComposition('', 'go')).toEqual([
      { kind: 'letter', letter: 'g' },
      { kind: 'letter', letter: 'o' },
    ]);
  });

  it('제안 선택으로 단어가 바뀌면 공통 접두사 뒤만 지우고 다시 채운다', () => {
    // "gud" → 자동완성 "good": 공통 접두사 "g" 유지, "ud" 지우고 "ood" 삽입
    expect(diffComposition('gud', 'good')).toEqual([
      { kind: 'backspace' },
      { kind: 'backspace' },
      { kind: 'letter', letter: 'o' },
      { kind: 'letter', letter: 'o' },
      { kind: 'letter', letter: 'd' },
    ]);
  });

  it('조합이 그대로면 아무 액션도 내지 않는다(중복 반영 방지)', () => {
    expect(diffComposition('good', 'good')).toEqual([]);
  });

  it('조합 문자열의 스페이스는 space 액션으로 편다', () => {
    expect(diffComposition('good', 'good ')).toEqual([{ kind: 'space' }]);
  });
});

describe('applyComposition', () => {
  it('조합이 늘어난 만큼 글자를 채운다', () => {
    const { state, dropped } = applyComposition(
      emptyState(5),
      '',
      'go',
      LENGTHS,
      0,
    );
    // 'g'는 첫 단어 "I"(1글자)를 채워 다음으로 넘어가고 'o'는 둘째 단어에
    expect(state.typed).toEqual(['g', 'o', '', '', '']);
    expect(dropped).toBe(0);
  });

  it('마지막 박스가 꽉 차 버려진 글자는 dropped로 세고 모델은 그대로 둔다', () => {
    const full = { typed: ['I', 'got', 'a', 'good', 'deal'], focus: 4 };
    const { state, dropped } = applyComposition(
      full,
      'deal',
      'deals',
      LENGTHS,
      0,
    );
    expect(state).toEqual(full);
    expect(dropped).toBe(1);
  });

  it('조합 내 백스페이스는 버려진 글자부터 되돌려 실제 글자를 지우지 않는다', () => {
    const full = { typed: ['I', 'got', 'a', 'good', 'deal'], focus: 4 };
    // IME 버퍼는 'deals'였지만 모델은 'deal'(s는 버려짐) — 백스페이스 한 번은 s만 무효화해야 한다
    const { state, dropped } = applyComposition(
      full,
      'deals',
      'deal',
      LENGTHS,
      1,
    );
    expect(state).toEqual(full); // 'deal'의 l이 지워지면 안 된다
    expect(dropped).toBe(0);
  });

  it('버려진 글자가 없으면 백스페이스가 모델 글자를 지운다', () => {
    const full = { typed: ['I', 'got', 'a', 'good', 'deal'], focus: 4 };
    const { state } = applyComposition(full, 'deal', 'dea', LENGTHS, 0);
    expect(state.typed[4]).toBe('dea');
  });
});
