// 복습 영작 입력 모델 — 단어별 입력 배열(typed)과 활성 단어(focus)를 다룬다.
// 단어가 정답 글자 수만큼 차면 자동으로 다음 단어로 넘어가고, 단어 박스를 눌러 특정 단어만 고칠 수 있다.

export interface InputState {
  typed: string[]; // 단어별로 입력한 글자
  focus: number; // 현재 입력 중인 단어 인덱스
}

export const emptyState = (wordCount: number): InputState => ({
  typed: Array.from({ length: wordCount }, () => ''),
  focus: 0,
});

// 글자 추가 — 활성 단어가 정답 글자 수만큼 차면 다음 단어로 focus를 넘긴다.
// 이미 꽉 찬 단어(마지막 칸 초과, 또는 클릭해서 고른 완성 단어)에는 넣지 않는다 — 백스페이스로 지운 뒤 다시 친다
export const appendLetter = (
  state: InputState,
  letter: string,
  lengths: number[],
): InputState => {
  const { focus } = state;
  if (state.typed[focus].length >= lengths[focus]) return state;
  const typed = state.typed.map((word, i) =>
    i === focus ? word + letter : word,
  );
  const filled = typed[focus].length === lengths[focus];
  const nextFocus = filled && focus < lengths.length - 1 ? focus + 1 : focus;
  return { typed, focus: nextFocus };
};

// 지우기 — 활성 단어의 마지막 글자를 지우고, 비어 있으면 앞 단어로 넘어가 지운다
export const backspace = (state: InputState): InputState => {
  const { typed, focus } = state;
  if (typed[focus].length > 0) {
    return {
      typed: typed.map((word, i) => (i === focus ? word.slice(0, -1) : word)),
      focus,
    };
  }
  if (focus > 0) {
    const prev = focus - 1;
    return {
      typed: typed.map((word, i) => (i === prev ? word.slice(0, -1) : word)),
      focus: prev,
    };
  }
  return state;
};

// 스페이스/다음 — 현재 단어에 입력이 있으면 다음 단어로 조기 이동한다
export const advance = (state: InputState, wordCount: number): InputState => {
  if (state.typed[state.focus] === '') return state;
  return state.focus < wordCount - 1
    ? { ...state, focus: state.focus + 1 }
    : state;
};

// 단어 박스 클릭 — 해당 단어로 focus 이동(특정 단어만 고치기)
export const focusWord = (state: InputState, index: number): InputState => ({
  ...state,
  focus: index,
});

// 확인 가능 — 단어가 하나 이상 있고 모두 한 글자 이상 입력됨(빈 정답 방어)
export const isComplete = (state: InputState): boolean =>
  state.typed.length > 0 && state.typed.every((word) => word.length > 0);

// 스마트 따옴표(' ' ‚ ‛ ′ / " " „ ‟ ″)를 ASCII 따옴표로 접는다.
// 정답에 아포스트로피·따옴표가 들어있을 때, 네이티브 키보드의 자동 치환에도 채점이 흔들리지 않게 한다.
export const normalizeQuotes = (text: string): string =>
  text.replace(/[‘’‚‛′]/g, "'").replace(/[“”„‟″]/g, '"');

// 단어별 정답 여부(대소문자·스마트따옴표 무시) — 정답 쪽에 스마트따옴표가 저장돼 있어도 맞도록 양쪽을 정규화한다
export const gradeWords = (typed: string[], answer: string[]): boolean[] =>
  answer.map(
    (word, i) =>
      normalizeQuotes(typed[i] ?? '').toLowerCase() ===
      normalizeQuotes(word).toLowerCase(),
  );

// 첫 오답 단어 인덱스 — 오답 시 그 단어로 커서를 보내 바로 고치게 한다(없으면 -1)
export const firstWrong = (ok: boolean[]): number => ok.indexOf(false);

// 네이티브 키보드 입력을 모델 액션으로 변환하기 위한 표현
export type ReviewInputAction =
  | { kind: 'letter'; letter: string }
  | { kind: 'space' }
  | { kind: 'backspace' };

// InputEvent(inputType, data)를 모델에 적용할 액션들로 바꾼다. 조합입력(IME)은 여기서 다루지 않고
// compositionend에서 완성된 문자열을 'insertText'로 넘겨 재사용한다. 순수 함수라 분기를 테스트로 고정한다.
export const parseInputEvent = (
  inputType: string,
  data: string,
): ReviewInputAction[] => {
  if (inputType.startsWith('delete')) return [{ kind: 'backspace' }];
  // insert* 또는 inputType 미보고(일부 안드로이드 키보드)인데 데이터가 있으면 삽입으로 본다
  if (inputType.startsWith('insert') || (inputType === '' && data.length > 0)) {
    const actions: ReviewInputAction[] = [];
    for (const ch of data) {
      if (ch === ' ') actions.push({ kind: 'space' });
      else if (ch !== '\n' && ch !== '\r')
        actions.push({ kind: 'letter', letter: normalizeQuotes(ch) });
    }
    return actions;
  }
  return [];
};
