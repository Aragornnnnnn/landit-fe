// TranscriptEditor — 키보드 입력창이 영어만 받고, 한도를 지키고, 조합 입력을 깨지 않는지 검증한다
import { useState } from 'react';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { Toaster } from '@/shared/ui/toast';

import { ANSWER_MAX_LENGTH } from '../../model/answer-length';
import { TranscriptEditor } from './TranscriptEditor';

// 진동은 경계(네이티브 셸)라 목으로 둔다
const hapticMock = vi.hoisted(() => vi.fn());
vi.mock('@/shared/haptics', () => ({ haptic: hapticMock }));

afterEach(() => {
  cleanup();
  localStorage.clear();
  vi.restoreAllMocks();
});

describe('TranscriptEditor', () => {
  describe('키보드 입력', () => {
    it('열리면 커서가 문장 끝에 놓인다 — 말한 문장을 이어 쓰거나 고치기 시작하는 자리다', () => {
      const { input } = renderEditing('I went to the beach.');

      expect(input).toHaveFocus();
      expect((input as HTMLTextAreaElement).selectionStart).toBe(
        'I went to the beach.'.length,
      );
    });

    it('글이 늘면 입력창도 글 높이만큼 늘어난다 — 남는 자리를 두고 안에서 스크롤하지 않게', () => {
      // jsdom은 글 높이를 계산하지 않는다 — 글자 수에 비례하는 높이로 흉내 낸다
      vi.spyOn(
        HTMLTextAreaElement.prototype,
        'scrollHeight',
        'get',
      ).mockImplementation(function (this: HTMLTextAreaElement) {
        return this.value.length * 2;
      });
      const { input } = renderEditing('Hello');

      fireEvent.change(input, {
        target: { value: 'Hello there, nice to meet you' },
      });

      expect(input.style.height).toBe(
        `${'Hello there, nice to meet you'.length * 2}px`,
      );
    });

    it('글자 수 한도를 넘게 치면 한도까지만 넘기고 더 쓸 수 없다고 안내한다', () => {
      const { input, onChange } = renderEditing();

      fireEvent.change(input, {
        target: { value: 'a'.repeat(ANSWER_MAX_LENGTH + 20) },
      });

      expect(onChange).toHaveBeenLastCalledWith('a'.repeat(ANSWER_MAX_LENGTH));
      // 토스트와 화면 읽기용 안내 둘 다 뜬다
      expect(
        screen.getAllByText(
          `${ANSWER_MAX_LENGTH.toLocaleString()}자까지 입력할 수 있어요`,
        ),
      ).toHaveLength(2);
    });

    it('한도에서 중간에 끼워 넣으면 뒤에 있던 글은 그대로 두고 끼워 넣은 글만 자른다', () => {
      const full = `${'a'.repeat(ANSWER_MAX_LENGTH - 3)}END`;
      const { input, onChange } = renderEditing(full);

      // 맨 앞에 'xyz'를 끼워 넣은 직후의 값과 커서
      fireEvent.change(input, {
        target: { value: `xyz${full}`, selectionStart: 3, selectionEnd: 3 },
      });

      expect(onChange).toHaveBeenLastCalledWith(full);
    });

    it('한도에 닿으면 화면 읽기에도 더 쓸 수 없다고 알린다', () => {
      renderEditing('a'.repeat(ANSWER_MAX_LENGTH));

      expect(screen.getByRole('status')).toHaveTextContent(
        `${ANSWER_MAX_LENGTH.toLocaleString()}자까지 입력할 수 있어요`,
      );
    });

    it('글자 수 표시는 입력창 설명으로 함께 읽힌다', () => {
      const { input } = renderEditing('a'.repeat(ANSWER_MAX_LENGTH - 50));

      expect(input).toHaveAccessibleDescription(
        `${ANSWER_MAX_LENGTH - 50}/${ANSWER_MAX_LENGTH.toLocaleString()}`,
      );
    });

    it('한도에 가까워지면 지금 글자 수를 보여 준다', () => {
      renderEditing('a'.repeat(ANSWER_MAX_LENGTH - 50));

      expect(
        screen.getByText(
          `${ANSWER_MAX_LENGTH - 50}/${ANSWER_MAX_LENGTH.toLocaleString()}`,
        ),
      ).toBeInTheDocument();
    });

    it('한도와 멀면 글자 수를 보이지 않는다', () => {
      renderEditing('Hello');

      expect(screen.queryByText(/\/1,000/)).not.toBeInTheDocument();
    });

    // 실제 화면처럼 넘긴 값이 다시 text로 돌아오게 상태를 든다
    const renderEditing = (initial = '') => {
      const onChange = vi.fn();
      const onSubmit = vi.fn();
      const Host = () => {
        const [text, setText] = useState(initial);
        return (
          <TranscriptEditor
            text={text}
            onChange={(value) => {
              onChange(value);
              setText(value);
            }}
            onSubmit={onSubmit}
          />
        );
      };
      render(
        <>
          <Host />
          <Toaster />
        </>,
      );
      return { input: screen.getByRole('textbox'), onChange, onSubmit };
    };
    const englishNotice = () => screen.queryByText('영어로만 입력할 수 있어요');

    it('한글을 치면 빼고 넘기고 영어로 입력하라고 토스트로 안내한다', () => {
      const { input, onChange } = renderEditing();

      fireEvent.change(input, { target: { value: 'hi 안녕' } });

      expect(onChange).toHaveBeenCalledWith('hi ');
      expect(englishNotice()).toBeInTheDocument();
    });

    it('영어만 치면 그대로 넘기고 안내하지 않는다', () => {
      const { input, onChange } = renderEditing();

      fireEvent.change(input, { target: { value: 'hi there' } });

      expect(onChange).toHaveBeenCalledWith('hi there');
      expect(englishNotice()).not.toBeInTheDocument();
    });

    it('한글을 치면 입력 박스를 흔들고 진동을 준다', () => {
      // 토스트만으로는 글자가 안 써지는 이유를 알아채기 어렵다
      const { input } = renderEditing();

      fireEvent.change(input, { target: { value: 'ㅎ' } });

      expect(input.closest('.animate-shake')).not.toBeNull();
      expect(hapticMock).toHaveBeenCalledWith('warning');
    });

    it('흔들림이 끝나면 다음 한글에 다시 흔들 수 있게 거둔다', () => {
      const { input } = renderEditing();
      fireEvent.change(input, { target: { value: 'ㅎ' } });

      // jsdom엔 AnimationEvent가 없어 React가 접두사 붙은 이름으로 듣는다
      fireEvent(
        input.closest('.animate-shake')!,
        new Event('webkitAnimationEnd', { bubbles: true }),
      );

      expect(input.closest('.animate-shake')).toBeNull();
    });

    it('영어만 치면 흔들지 않는다', () => {
      const { input } = renderEditing();

      fireEvent.change(input, { target: { value: 'hi' } });

      expect(input.closest('.animate-shake')).toBeNull();
      expect(hapticMock).not.toHaveBeenCalled();
    });

    it('한글을 연달아 쳐도 토스트는 하나만 띄운다', () => {
      // 자모마다 토스트를 새로 띄우면 깜빡이며 겹친다
      const { input } = renderEditing();
      fireEvent.change(input, { target: { value: 'ㅎ' } });

      fireEvent.change(input, { target: { value: 'ㅏ' } });

      expect(screen.getAllByText('영어로만 입력할 수 있어요')).toHaveLength(1);
    });

    it('한글 조합 중에는 거르지 않고 그대로 넘긴다', () => {
      // 조합 중에 글자를 지우면 입력기가 꼬여 글자가 깨진다
      const { input, onChange } = renderEditing();
      fireEvent.compositionStart(input);

      fireEvent.change(input, { target: { value: 'hi 안' } });

      expect(onChange).toHaveBeenLastCalledWith('hi 안');
    });

    it('한글 조합이 끝나면 거르고 안내한다', () => {
      const { input, onChange } = renderEditing();
      fireEvent.compositionStart(input);
      fireEvent.change(input, { target: { value: 'hi 안' } });

      fireEvent.compositionEnd(input);

      expect(onChange).toHaveBeenLastCalledWith('hi ');
      expect(englishNotice()).toBeInTheDocument();
    });

    it('조합이 끝났다는 신호 없이 입력창을 떠나도 다음 입력은 거른다', () => {
      // 일부 키보드는 조합 끝 신호를 빠뜨린다 — 그대로 두면 이후 입력이 전부 통과한다
      const { input, onChange } = renderEditing();
      fireEvent.compositionStart(input);
      fireEvent.blur(input);

      fireEvent.change(input, { target: { value: 'hi 안' } });

      expect(onChange).toHaveBeenLastCalledWith('hi ');
    });

    it('한글 조합을 끝내는 Enter로는 전송하지 않는다', () => {
      const { input, onSubmit } = renderEditing('hi 안');

      fireEvent.keyDown(input, { key: 'Enter', isComposing: true });

      expect(onSubmit).not.toHaveBeenCalled();
    });

    it('조합 끝 신호 없이 입력창을 떠나면 남은 한글을 거르고 안내한다', () => {
      // 거르지 않고 두면 한글이 화면에 남고, 전송을 눌러도 조용히 무시된다
      const { input, onChange } = renderEditing();
      fireEvent.compositionStart(input);
      fireEvent.change(input, { target: { value: 'hi 안' } });

      fireEvent.blur(input);

      expect(onChange).toHaveBeenLastCalledWith('hi ');
      expect(englishNotice()).toBeInTheDocument();
    });

    it('분해형 악센트를 합치기만 했으면 안내하지 않는다', () => {
      // 지운 글자가 없는데 경고가 뜨면 영어만 친 사람이 혼난 꼴이 된다
      const { input, onChange } = renderEditing();

      fireEvent.change(input, { target: { value: 'cafe\u0301' } });

      expect(onChange).toHaveBeenLastCalledWith('caf\u00e9');
      expect(englishNotice()).not.toBeInTheDocument();
      expect(hapticMock).not.toHaveBeenCalled();
    });

    it('거르고 나면 커서는 그 자리에서 바로 쓰던 곳에 놓인다', () => {
      // 늦게 놓으면 그사이 들어온 띄어쓰기 앞으로 커서가 돌아가, 다음 글자와 지우기가 엉뚱한 자리에 간다(안드로이드 Gboard)
      const { input } = renderEditing('hello world');

      fireEvent.change(input, {
        target: { value: 'hello안 world', selectionStart: 6, selectionEnd: 6 },
      });

      expect((input as HTMLTextAreaElement).value).toBe('hello world');
      expect((input as HTMLTextAreaElement).selectionStart).toBe(5);
    });

    it('조합을 확정하는 Enter(키 코드 229)로는 전송하지 않는다', () => {
      // Safari는 조합 끝 신호를 Enter보다 먼저 보내 isComposing이 false로 온다
      const { input, onSubmit } = renderEditing('hi');

      fireEvent.keyDown(input, { key: 'Enter', keyCode: 229 });

      expect(onSubmit).not.toHaveBeenCalled();
    });

    it('조합 중이 아닌 Enter는 전송한다', () => {
      const { input, onSubmit } = renderEditing('hi');

      fireEvent.keyDown(input, { key: 'Enter' });

      expect(onSubmit).toHaveBeenCalled();
    });
  });

  // iOS 한글 키보드는 조합 이벤트 없이 자모마다 "지우고 다시 넣기"로 글자를 합친다.
  // 키보드가 넣은 한글을 웹이 지우면, 키보드는 그 글자가 아직 있다고 믿고 보내는 지우기로 앞 영어를 지운다
  describe('키보드 입력 — 조합 없이 지우고 다시 넣는 키보드(iOS 한글)', () => {
    const renderEditor = (initial = 'hello') => {
      const Host = () => {
        const [text, setText] = useState(initial);
        return <TranscriptEditor text={text} onChange={setText} />;
      };
      render(
        <>
          <Host />
          <Toaster />
        </>,
      );
      return screen.getByRole('textbox');
    };
    // 키보드가 보내는 입력 신호 하나 — 웹이 막았으면 true
    const press = (
      input: HTMLElement,
      inputType: 'insertText' | 'deleteContentBackward',
      data: string | null = null,
    ) =>
      !fireEvent(
        input,
        new InputEvent('beforeinput', {
          inputType,
          data,
          cancelable: true,
          bubbles: true,
        }),
      );

    it('한글은 들어가기 전에 막고 바로 흔들고 진동하고 안내한다', () => {
      const input = renderEditor();

      expect(press(input, 'insertText', 'ㅇ')).toBe(true);

      expect(input.closest('.animate-shake')).not.toBeNull();
      expect(hapticMock).toHaveBeenCalledWith('warning');
      expect(screen.getByText('영어로만 입력할 수 있어요')).toBeInTheDocument();
    });

    it('영어는 막지 않는다', () => {
      const input = renderEditor();

      expect(press(input, 'insertText', 'a')).toBe(false);
      expect(hapticMock).not.toHaveBeenCalled();
    });

    it('한글을 막은 뒤 키보드가 그 글자를 합치려 보내는 지우기는 막아 앞 영어를 지킨다', () => {
      const input = renderEditor();
      press(input, 'insertText', 'ㅇ');

      // ㅏ를 치면 키보드는 ㅇ을 지우고 "아"를 넣는다
      expect(press(input, 'deleteContentBackward')).toBe(true);
      expect(press(input, 'insertText', '아')).toBe(true);
      expect(press(input, 'deleteContentBackward')).toBe(true);
      expect(press(input, 'insertText', '안')).toBe(true);
    });

    it('막은 글자를 다 지운 뒤의 지우기는 그대로 둔다 — 그건 사람이 누른 지우기다', () => {
      const input = renderEditor();
      press(input, 'insertText', 'ㅇ');

      // 백스페이스로 키보드가 기억하던 ㅇ을 지웠다
      expect(press(input, 'deleteContentBackward')).toBe(true);

      expect(press(input, 'deleteContentBackward')).toBe(false);
    });

    it('띄어쓰기나 영어를 치면 키보드가 조합을 끝내므로 다음 지우기는 그대로 둔다', () => {
      const input = renderEditor();
      press(input, 'insertText', '안');

      expect(press(input, 'insertText', ' ')).toBe(false);

      expect(press(input, 'deleteContentBackward')).toBe(false);
    });

    it('입력창을 다시 누르면 키보드가 조합을 끝내므로 다음 지우기는 그대로 둔다', () => {
      // 커서를 옮기면 키보드는 합치던 글자를 잊는다
      const input = renderEditor();
      press(input, 'insertText', '안');

      fireEvent.pointerDown(input);

      expect(press(input, 'deleteContentBackward')).toBe(false);
    });

    it('막은 게 없으면 지우기는 그대로 둔다', () => {
      const input = renderEditor();

      expect(press(input, 'deleteContentBackward')).toBe(false);
    });
  });
});
