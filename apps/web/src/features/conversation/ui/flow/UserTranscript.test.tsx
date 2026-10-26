// UserTranscript — 듣는 중 점(물결)이 언제 보이고 언제 사라지는지 검증한다
import { useState } from 'react';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { Toaster } from '@/shared/ui/toast';

import { UserTranscript } from './UserTranscript';

// 진동은 경계(네이티브 셸)라 목으로 둔다
const hapticMock = vi.hoisted(() => vi.fn());
vi.mock('@/shared/haptics', () => ({ haptic: hapticMock }));

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

const listeningDots = () => screen.queryByRole('img', { name: '듣는 중' });

describe('UserTranscript', () => {
  it('아직 아무 말도 확정되지 않았으면 듣는 중 표시로 점이 보인다', () => {
    render(
      <UserTranscript text="" phase="USER_SPEAKING" speechPending={false} />,
    );

    expect(listeningDots()).toBeInTheDocument();
  });

  it('확정 전 말이 남아 있으면 글자 뒤에 점이 보인다', () => {
    render(
      <UserTranscript
        text="I went to the park"
        phase="USER_SPEAKING"
        speechPending
      />,
    );

    expect(listeningDots()).toBeInTheDocument();
  });

  it('말한 것이 모두 확정되면 점이 사라진다', () => {
    render(
      <UserTranscript
        text="I went to the park"
        phase="USER_SPEAKING"
        speechPending={false}
      />,
    );

    expect(listeningDots()).not.toBeInTheDocument();
  });

  it('듣는 중이 아니면 점이 보이지 않는다', () => {
    render(<UserTranscript text="" phase="AI_THINKING" speechPending />);

    expect(listeningDots()).not.toBeInTheDocument();
  });

  it('글이 넘친 상태에서 점이 다시 나타나면 끝으로 다시 붙인다', () => {
    // 점이 다음 줄로 넘어가면 높이가 늘어난다 — 글자가 그대로여도 스크롤을 다시 맞춰야 점이 잘리지 않는다
    let scrollHeight = 100;
    vi.spyOn(HTMLElement.prototype, 'scrollHeight', 'get').mockImplementation(
      () => scrollHeight,
    );
    const text = 'I went to the park with my friend yesterday';
    const { rerender } = render(
      <UserTranscript
        text={text}
        phase="USER_SPEAKING"
        speechPending={false}
      />,
    );

    scrollHeight = 140;
    rerender(
      <UserTranscript text={text} phase="USER_SPEAKING" speechPending />,
    );

    // 글자를 담은 스크롤 상자
    const box = screen.getByText(text).parentElement!;
    expect(box.scrollTop).toBe(140);
  });

  it('넘친 답변을 맨 위까지 올려 보면 윗변 흐림을 거둔다', () => {
    // 스크롤로 앞부분을 다시 볼 때 첫 줄이 흐려져 있으면 읽을 수 없다
    vi.spyOn(HTMLElement.prototype, 'scrollHeight', 'get').mockReturnValue(140);
    const text = 'I went to the park with my friend yesterday';
    render(
      <UserTranscript
        text={text}
        phase="USER_SPEAKING"
        speechPending={false}
      />,
    );
    const box = screen.getByText(text).parentElement!;
    expect(box.className).toContain('mask-image');

    box.scrollTop = 0;
    fireEvent.scroll(box);

    expect(box.className).not.toContain('mask-image');
  });

  describe('키보드 입력', () => {
    // 실제 화면처럼 넘긴 값이 다시 text로 돌아오게 상태를 든다
    const renderEditing = (initial = '') => {
      const onChange = vi.fn();
      const onSubmit = vi.fn();
      const Host = () => {
        const [text, setText] = useState(initial);
        return (
          <UserTranscript
            text={text}
            phase="USER_SPEAKING"
            editing
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
    const englishNotice = () => screen.queryByText('영어로만 입력해 주세요');

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
      expect(hapticMock).toHaveBeenCalledWith('error');
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

      expect(screen.getAllByText('영어로만 입력해 주세요')).toHaveLength(1);
    });

    it('한글 조합 중에는 거르지 않고, 조합이 끝나면 거른다', () => {
      // 조합 중에 글자를 지우면 입력기가 꼬여 글자가 깨진다
      const { input, onChange } = renderEditing();

      fireEvent.compositionStart(input);
      fireEvent.change(input, { target: { value: 'hi 안' } });
      expect(onChange).toHaveBeenLastCalledWith('hi 안');

      fireEvent.compositionEnd(input);
      expect(onChange).toHaveBeenLastCalledWith('hi ');
      expect(englishNotice()).toBeInTheDocument();
    });

    it('한글 조합을 끝내는 Enter로는 전송하지 않는다', () => {
      const { input, onSubmit } = renderEditing('hi 안');

      fireEvent.keyDown(input, { key: 'Enter', isComposing: true });

      expect(onSubmit).not.toHaveBeenCalled();
    });

    it('조합 중이 아닌 Enter는 전송한다', () => {
      const { input, onSubmit } = renderEditing('hi');

      fireEvent.keyDown(input, { key: 'Enter' });

      expect(onSubmit).toHaveBeenCalled();
    });
  });
});
