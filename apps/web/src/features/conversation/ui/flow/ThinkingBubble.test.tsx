// ThinkingBubble — 점 말풍선이 대화 칸 밖에 붙으면 칸이 따라 내려가 보이게 하는지 검증한다
import { cleanup, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { ConversationLog } from './ConversationLog';
import { ThinkingBubble } from './ThinkingBubble';

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

describe('ThinkingBubble', () => {
  it('긴 상대 말 아래에 붙어 칸 밖에 놓이면 칸이 점 말풍선까지 내려간다', () => {
    // Given 칸(높이 200)이 0~200에 있고, 점 말풍선은 그 아래 900~940에 붙는다 — jsdom엔 레이아웃이 없어 위치를 심어 준다
    Element.prototype.scrollTo = vi.fn();
    vi.spyOn(HTMLElement.prototype, 'scrollHeight', 'get').mockReturnValue(
      1000,
    );
    vi.spyOn(HTMLElement.prototype, 'clientHeight', 'get').mockReturnValue(200);
    vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockImplementation(
      function (this: HTMLElement) {
        return (
          // 점 말풍선 — 바로 안에 '생각 중' 표시를 품은 상자
          (
            this.firstElementChild?.getAttribute('role') === 'status'
              ? { top: 900, bottom: 940, height: 40 }
              : { top: 0, bottom: 200, height: 200 }
          ) as DOMRect
        );
      },
    );

    // When 점 말풍선이 붙으면
    render(
      <ConversationLog entries={[]} latestKey={0}>
        <ThinkingBubble />
      </ConversationLog>,
    );

    // Then 점 말풍선 바닥이 칸 바닥에 오게(940 - 200) 내려간다
    expect(Element.prototype.scrollTo).toHaveBeenLastCalledWith({
      top: 740,
      behavior: 'instant',
    });
  });

  it('꺼지면 점 말풍선이 빠진다', async () => {
    // Given 점 말풍선이 떠 있다
    Element.prototype.scrollTo = vi.fn();
    const { rerender } = render(
      <ConversationLog entries={[]} latestKey={0}>
        <ThinkingBubble shown />
      </ConversationLog>,
    );
    expect(screen.getByRole('status')).toBeInTheDocument();

    // When 대답의 소리가 나 꺼지면
    rerender(
      <ConversationLog entries={[]} latestKey={1}>
        <ThinkingBubble shown={false} />
      </ConversationLog>,
    );

    // Then 흐려지며 빠진 뒤 칸에서 사라진다
    await waitFor(() => expect(screen.queryByRole('status')).toBeNull());
  });
});
