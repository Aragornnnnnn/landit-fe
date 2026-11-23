// MyBubble — 지금 차례 내 말풍선이 상태마다 무엇을 보이고, 확인 중 눌렀을 때 고치기로 가는지 검증한다
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { editHintSeen } from '../../model/edit-hint-seen';
import { MyBubble } from './MyBubble';

afterEach(() => {
  cleanup();
  localStorage.clear();
});

const listeningDots = () => screen.queryByRole('img', { name: '듣는 중' });
const EDIT_HINT = '말한 내용과 다르면 눌러서 고칠 수 있어요';

describe('MyBubble', () => {
  describe('말하는 중', () => {
    it('아직 아무 말도 확정되지 않았으면 듣는 중 점만 보인다', () => {
      render(
        <MyBubble
          onEdit={vi.fn()}
          state="speaking"
          text=""
          speechPending={false}
        />,
      );

      expect(listeningDots()).toBeInTheDocument();
    });

    it('확정 전 말이 남아 있으면 글자 뒤에 점이 보인다', () => {
      render(
        <MyBubble
          onEdit={vi.fn()}
          state="speaking"
          text="I went"
          speechPending
        />,
      );

      expect(screen.getByText('I went')).toBeInTheDocument();
      expect(listeningDots()).toBeInTheDocument();
    });

    it('말한 것이 모두 확정되면 점이 사라진다', () => {
      render(
        <MyBubble
          onEdit={vi.fn()}
          state="speaking"
          text="I went"
          speechPending={false}
        />,
      );

      expect(listeningDots()).not.toBeInTheDocument();
    });
  });

  describe('말한 뒤 확인', () => {
    it('말풍선을 누르면 고치기로 간다', () => {
      const onEdit = vi.fn();
      render(
        <MyBubble state="review" text="I went to the bitch." onEdit={onEdit} />,
      );

      fireEvent.click(screen.getByText('I went to the bitch.'));

      expect(onEdit).toHaveBeenCalledTimes(1);
    });

    it('고칠 수 있다는 수정 표시를 띄운다', () => {
      render(<MyBubble state="review" text="Hi" onEdit={vi.fn()} />);

      expect(screen.getByText('수정')).toBeInTheDocument();
    });

    it('스크린 리더도 고치기 버튼에서 인식된 문장을 듣는다', () => {
      render(
        <MyBubble
          state="review"
          text="I went to the bitch."
          onEdit={vi.fn()}
        />,
      );

      expect(
        screen.getByRole('button', { name: /I went to the bitch\./ }),
      ).toBeInTheDocument();
    });

    it('처음 확인이면 고칠 수 있다는 안내를 버튼 설명으로 함께 띄운다', () => {
      render(<MyBubble state="review" text="Hi" onEdit={vi.fn()} />);

      expect(
        screen.getByRole('button', { name: /답변 고치기/ }),
      ).toHaveAccessibleDescription(EDIT_HINT);
    });

    it('안내를 이미 본 기기면 띄우지 않는다', () => {
      editHintSeen.mark();
      render(<MyBubble state="review" text="Hi" onEdit={vi.fn()} />);

      expect(screen.queryByText(EDIT_HINT)).not.toBeInTheDocument();
    });

    it('말하는 중이 아니라 듣는 중 점을 띄우지 않는다', () => {
      render(
        <MyBubble state="review" text="Hi" speechPending onEdit={vi.fn()} />,
      );

      expect(listeningDots()).not.toBeInTheDocument();
    });
  });

  it('보낸 말풍선은 누를 수 없다', () => {
    render(<MyBubble onEdit={vi.fn()} state="sent" text="Hello!" />);

    expect(screen.getByText('Hello!')).toBeInTheDocument();
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });

  it('보내지 못한 말풍선은 보내지 못했다는 표시를 붙인다', () => {
    render(<MyBubble onEdit={vi.fn()} state="failed" text="Hello!" />);

    expect(
      screen.getByRole('img', { name: '보내지 못한 답변' }),
    ).toBeInTheDocument();
  });
});
